import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Drama from "../src/models/Drama";
import Episode from "../src/models/Episode";
import { deleteCacheByPattern } from "../src/lib/cache";

dotenv.config({
  path: [".env.development.local", ".env.local", ".env.development", ".env"],
});

type SourceEpisode = {
  episodeNum: number;
  subtitle_vtt?: string;
  subtitle_srt?: string;
  videoUrl?: Record<string, string>;
};

type SourceSeries = {
  id: string | number;
  episodes?: SourceEpisode[];
};

const apply = process.argv.includes("--apply");
const sourceFlag = process.argv.indexOf("--source");
const sourcePath = path.resolve(
  sourceFlag >= 0
    ? process.argv[sourceFlag + 1] || ""
    : "video-crawl/data/dramawave-playable/series.json",
);

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Thiếu MONGODB_URI");
  if (!fs.existsSync(sourcePath)) throw new Error(`Không tìm thấy ${sourcePath}`);

  const series = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as SourceSeries[];
  await mongoose.connect(process.env.MONGODB_URI);

  let matchedSeries = 0;
  let matchedEpisodes = 0;
  let fullHdUpdates = 0;
  let subtitleUpdates = 0;

  for (const item of series) {
    const sourceId = clean(item.id);
    const drama = await Drama.findOne({
      slug: { $regex: `-${sourceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    }).select("_id");
    if (!drama) continue;
    matchedSeries += 1;

    for (const sourceEpisode of item.episodes || []) {
      const episode = await Episode.findOne({
        dramaId: drama._id,
        name: String(sourceEpisode.episodeNum),
      });
      if (!episode) continue;
      matchedEpisodes += 1;

      const fullHd = clean(sourceEpisode.videoUrl?.video_1080);
      const subtitleVtt = clean(sourceEpisode.subtitle_vtt);
      const subtitleSrt = clean(sourceEpisode.subtitle_srt);
      const update: Record<string, string> = {};

      if (fullHd && episode.link_m3u8 !== fullHd) {
        update.link_m3u8 = fullHd;
        fullHdUpdates += 1;
      }
      if (subtitleVtt && episode.subtitle_vtt !== subtitleVtt) {
        update.subtitle_vtt = subtitleVtt;
        subtitleUpdates += 1;
      }
      if (subtitleSrt && episode.subtitle_srt !== subtitleSrt) {
        update.subtitle_srt = subtitleSrt;
        subtitleUpdates += 1;
      }

      if (apply && Object.keys(update).length) {
        await Episode.updateOne({ _id: episode._id }, { $set: update });
      }
    }
  }

  console.log(JSON.stringify({
    mode: apply ? "applied" : "dry-run",
    matchedSeries,
    matchedEpisodes,
    fullHdUpdates,
    subtitleUpdates,
  }, null, 2));
  if (apply) {
    await deleteCacheByPattern("feed:*");
    await deleteCacheByPattern("public:dramas:*");
    await deleteCacheByPattern("drama:slug:*");
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
