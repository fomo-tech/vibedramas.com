import { NextRequest, NextResponse } from "next/server";
import { createDecipheriv } from "node:crypto";

// Only proxy from the CDN domains used by the imported drama sources.
const ALLOWED_HOSTS = [
  "s6.kkphimplayer6.com",
  "kkphimplayer6.com",
  "akamai-static.shorttv.live",
  "video-v6.mydramawave.com",
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

/**
 * Rewrite relative URLs inside m3u8 playlists to absolute proxy paths.
 * HLS.js resolves sub-playlist/segment URLs relative to the m3u8 base URL,
 * so we must make every URL absolute via the proxy before returning.
 */
function rewritePlaylist(text: string, baseUrl: string): string {
  const base = new URL(baseUrl);

  const toProxyUrl = (rawUrl: string): string => {
    const resolved = new URL(rawUrl, baseUrl);
    // Some signed HLS providers require the manifest query on child assets too.
    if (!resolved.search && base.search) resolved.search = base.search;
    return isAllowed(resolved.toString())
      ? `/api/proxy/stream?url=${encodeURIComponent(resolved.toString())}`
      : rawUrl;
  };

  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return line;

      // Rewrite URI attributes such as EXT-X-KEY and EXT-X-MAP too.
      if (t.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          return `URI="${toProxyUrl(uri)}"`;
        });
      }

      return toProxyUrl(t);
    })
    .join("\n");
}

function convertSrtToVtt(text: string): string {
  const body = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${body.trim()}\n`;
}

/**
 * ShortTV prepends a 1024-byte `shortmax` envelope to encrypted MPEG-TS
 * segments. The envelope contains the AES key position and encrypted length.
 * Decrypt only this documented source format; ordinary HLS data passes through.
 */
function decryptShortMaxSegment(input: ArrayBuffer): Buffer {
  const data = Buffer.from(input);
  const envelopeSize = 0x400;

  if (data.length <= envelopeSize || data.subarray(0, 8).toString("ascii") !== "shortmax") {
    return data;
  }

  const keyOffset = Number(data.subarray(0x10, 0x14).toString("ascii"));
  const encryptedLength = Number(data.subarray(0x14, 0x18).toString("ascii"));
  if (
    !Number.isInteger(keyOffset) ||
    !Number.isInteger(encryptedLength) ||
    keyOffset < 0 ||
    keyOffset + 16 > envelopeSize ||
    encryptedLength <= 0 ||
    envelopeSize + encryptedLength > data.length
  ) {
    throw new Error("Invalid ShortTV segment envelope");
  }

  const key = data.subarray(keyOffset, keyOffset + 16);
  const iv = Buffer.from("shortmax00000000", "ascii");
  const encrypted = data.subarray(envelopeSize, envelopeSize + encryptedLength);
  const decipher = createDecipheriv("aes-128-cbc", key, iv);
  const clear = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const remainder = data.subarray(envelopeSize + encryptedLength);

  return remainder.length ? Buffer.concat([clear, remainder]) : clear;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  if (!isAllowed(targetUrl)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      // Do not forward credentials
      credentials: "omit",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get("content-type") || "";
    const isPlaylist =
      contentType.includes("mpegurl") || targetUrl.includes(".m3u8");

    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": isPlaylist ? "no-cache" : "public, max-age=86400",
    };

    const isVtt = /\.vtt(?:$|\?)/i.test(targetUrl);
    const isSrt = /\.srt(?:$|\?)/i.test(targetUrl);

    if (isPlaylist) {
      const text = await upstream.text();
      const rewritten = rewritePlaylist(text, targetUrl);
      return new NextResponse(rewritten, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        },
      });
    }

    // Subtitle files must keep a text subtitle MIME type or the browser will
    // download them instead of exposing them to the <track> element.
    if (isVtt || isSrt) {
      const text = await upstream.text();
      return new NextResponse(isSrt ? convertSrtToVtt(text) : text, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/vtt; charset=utf-8",
        },
      });
    }

    // HLS segments — decrypt the ShortTV `shortmax` envelope when present.
    const upstreamBuffer = await upstream.arrayBuffer();
    const isShortTvSegment =
      targetUrl.includes("akamai-static.shorttv.live/hls-encrypted/") &&
      /\.ts(?:$|\?)/i.test(targetUrl);
    const body = isShortTvSegment
      ? decryptShortMaxSegment(upstreamBuffer)
      : Buffer.from(upstreamBuffer);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        ...corsHeaders,
        "Content-Type": isShortTvSegment
          ? "video/mp2t"
          : contentType || "application/octet-stream",
        "Content-Length": String(body.byteLength),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "proxy error";
    return new NextResponse(msg, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
