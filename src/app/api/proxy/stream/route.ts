import { NextRequest, NextResponse } from "next/server";

// Only proxy from allowed CDN domains (KKPhim)
const ALLOWED_HOSTS = ["s6.kkphimplayer6.com", "kkphimplayer6.com"];

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
  // Directory part: strip filename, keep trailing slash
  const dir = base.pathname.replace(/[^/]*$/, "");

  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return line; // keep comments/empty

      // Resolve to absolute CDN URL
      let abs: string;
      if (t.startsWith("http://") || t.startsWith("https://")) {
        abs = t;
      } else if (t.startsWith("/")) {
        abs = `${base.protocol}//${base.host}${t}`;
      } else {
        abs = `${base.protocol}//${base.host}${dir}${t}`;
      }

      if (isAllowed(abs)) {
        return `/api/proxy/stream?url=${encodeURIComponent(abs)}`;
      }
      return line;
    })
    .join("\n");
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

    // TS segments — stream binary
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "video/mp2t",
        "Content-Length": String(buf.byteLength),
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
