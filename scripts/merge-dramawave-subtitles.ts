import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Episode from "../src/models/Episode";
import Drama from "../src/models/Drama";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({
  path:
    nodeEnv === "production"
      ? [".env.production.local", ".env.production", ".env.local", ".env"]
      : [".env.development.local", ".env.local", ".env.development", ".env"],
});

type SubtitleMeta = {
  subtitle_vtt: string;
  subtitle_srt: string;
  has_vietnamese_audio: boolean;
};

function walk(value: unknown, visit: (value: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!value || typeof value !== "object") return;

  const object = value as Record<string, unknown>;
  visit(object);
  for (const child of Object.values(object)) walk(child, visit);
}

async function readSubtitleMap(): Promise<Map<string, SubtitleMeta>> {
  const rawDir = path.resolve("video-crawl/data/raw");
  const files = (await fs.readdir(rawDir))
    .filter((file) => /^tab-\d+\.json$/.test(file))
    .sort();
  const byStream = new Map<string, SubtitleMeta>();

  for (const file of files) {
    const parsed = JSON.parse(
      await fs.readFile(path.join(rawDir, file), "utf8"),
    );
    walk(parsed, (object) => {
      const stream = String(object.external_audio_h264_m3u8 || "").trim();
      if (!stream || !Array.isArray(object.subtitle_list)) return;

      const subtitles = object.subtitle_list as Array<Record<string, unknown>>;
      const vietnamese = subtitles.find(
        (subtitle) =>
          String(subtitle.language || "").toLowerCase() === "vi-vn",
      );
      if (!vietnamese) return;

      const audio = Array.isArray(object.audio) ? object.audio : [];
      byStream.set(stream, {
        subtitle_vtt: String(vietnamese.vtt || "").trim(),
        subtitle_srt: String(vietnamese.subtitle || "").trim(),
        has_vietnamese_audio: audio.some(
          (language) => String(language).toLowerCase() === "vi-vn",
        ),
      });
    });
  }

  return byStream;
}

async function main(): Promise<void> {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";
  const subtitleMap = await readSubtitleMap();
  if (!subtitleMap.size) {
    console.log("ℹ️ Không tìm thấy metadata phụ đề Việt trong raw crawl.");
    return;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 120_000,
  });

  try {
    const episodes = await Episode.find({
      link_m3u8: { $in: [...subtitleMap.keys()] },
    });
    let updated = 0;
    for (const episode of episodes) {
      const metadata = subtitleMap.get(episode.link_m3u8);
      if (!metadata) continue;
      episode.set(metadata);
      await episode.save();
      updated += 1;
    }

    // Some upstream responses only describe the audio tracks on the first
    // episode. The series title is the stable source for explicitly dubbed
    // releases, so apply that flag to every episode in those series.
    const dubbedDramas = await Drama.find({
      name: { $regex: /(?:lồng tiếng|long tieng)/i },
    }).select("_id");
    const dubbedResult = await Episode.updateMany(
      { dramaId: { $in: dubbedDramas.map((drama) => drama._id) } },
      { $set: { has_vietnamese_audio: true } },
    );

    const unsupportedCount = await Episode.countDocuments({
      has_vietnamese_audio: { $ne: true },
      $and: [
        { $or: [{ subtitle_vtt: { $exists: false } }, { subtitle_vtt: "" }] },
        { $or: [{ subtitle_srt: { $exists: false } }, { subtitle_srt: "" }] },
      ],
    });

    console.log(
      `✅ Đã ghép phụ đề Việt cho ${updated}/${episodes.length} tập khớp URL HLS.`,
    );
    console.log(
      `✅ Đã đồng bộ cờ lồng tiếng Việt cho ${dubbedResult.modifiedCount} tập thuộc bản lồng tiếng.`,
    );
    if (unsupportedCount > 0) {
      console.warn(
        `⚠️ Còn ${unsupportedCount} tập không có cả tiếng Việt lẫn phụ đề Việt; dữ liệu nguồn cần được crawl bổ sung trước khi import lại.`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(
    `❌ Ghép phụ đề thất bại: ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 1;
});
