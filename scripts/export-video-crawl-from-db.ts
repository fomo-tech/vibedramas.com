import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Drama from "../src/models/Drama";
import Episode from "../src/models/Episode";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({
  path:
    nodeEnv === "production"
      ? [".env.production.local", ".env.production", ".env.local", ".env"]
      : [".env.development.local", ".env.local", ".env.development", ".env"],
});

const outputDir = path.resolve("video-crawl/data");

function episodeNumber(name: unknown): number {
  const match = String(name ?? "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function seriesKey(slug: unknown, id: unknown): string {
  const parts = String(slug ?? "").split("-").filter(Boolean);
  return parts.at(-1) || String(id);
}

async function writeJson(fileName: string, value: unknown): Promise<void> {
  await fs.writeFile(
    path.join(outputDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function main(): Promise<void> {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 120_000,
  });

  try {
    const [dramas, episodes] = await Promise.all([
      Drama.find({}).sort({ createdAt: 1, _id: 1 }).lean(),
      Episode.find({}).sort({ dramaId: 1, name: 1, _id: 1 }).lean(),
    ]);

    const episodesByDrama = new Map<string, typeof episodes>();
    for (const episode of episodes) {
      const key = String(episode.dramaId);
      const current = episodesByDrama.get(key) || [];
      current.push(episode);
      episodesByDrama.set(key, current);
    }

    const series = dramas.flatMap((drama) => {
      const playableEpisodes = (episodesByDrama.get(String(drama._id)) || [])
        .map((episode) => {
          const stream = String(episode.link_m3u8 || "").trim();
          const episodeNum = episodeNumber(episode.name);
          if (!stream || !episodeNum) return null;

          return {
            id: String(episode._id),
            episodeNum,
            videoDuration: 0,
            needDecrypt: false,
            external_audio_h264_m3u8: stream,
            subtitle_vtt: String(episode.subtitle_vtt || "").trim(),
            subtitle_srt: String(episode.subtitle_srt || "").trim(),
            hasVietnameseAudio: Boolean(episode.has_vietnamese_audio),
            videoUrl: { video_720: stream },
          };
        })
        .filter((episode): episode is NonNullable<typeof episode> => Boolean(episode));

      if (!playableEpisodes.length) return [];

      const id = seriesKey(drama.slug, drama._id);
      return [
        {
          id,
          name: drama.name,
          summary: drama.content || drama.name,
          cover: drama.thumb_url || drama.poster_url,
          totalEpisodes: Number(drama.episode_total) || playableEpisodes.length,
          episodes: playableEpisodes,
        },
      ];
    });

    const catalog = series.flatMap((item) =>
      item.episodes.map((episode) => ({
        key: `${item.id}-${episode.id}`,
        seriesId: item.id,
        seriesName: item.name,
        title: `${item.name} · Tập ${episode.episodeNum}`,
        episodeNum: episode.episodeNum,
        duration: episode.videoDuration,
        locked: false,
        needDecrypt: false,
        videoUrl: episode.videoUrl,
        subtitle_vtt: episode.subtitle_vtt,
        subtitle_srt: episode.subtitle_srt,
        hasVietnameseAudio: episode.hasVietnameseAudio,
      })),
    );

    await fs.mkdir(outputDir, { recursive: true });
    await writeJson("series.json", series);
    await writeJson("episodes.json", catalog);
    await writeJson("catalog.json", catalog);
    await writeJson("crawl-summary.json", {
      crawledAt: new Date().toISOString(),
      seriesCount: series.length,
      episodeCount: catalog.length,
      failedSeriesCount: 0,
      needDecryptCount: 0,
      failures: [],
      source: "local MongoDB export after Dramawave crawl",
      note: "H.264 playlist and subtitle URLs may be temporary; rerun the Dramawave crawler when they expire.",
    });

    const subtitleCount = catalog.filter(
      (episode) => episode.subtitle_vtt || episode.subtitle_srt,
    ).length;
    console.log(
      `✅ Đã khôi phục catalog: ${series.length} phim, ${catalog.length} tập, ${subtitleCount} tập có phụ đề Việt.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(
    `❌ Export catalog thất bại: ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 1;
});
