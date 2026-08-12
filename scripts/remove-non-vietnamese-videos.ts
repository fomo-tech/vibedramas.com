import dotenv from "dotenv";
import mongoose from "mongoose";
import Drama from "../src/models/Drama";
import Episode from "../src/models/Episode";
import HeroSlide from "../src/models/HeroSlide";
import { deleteCacheByPattern } from "../src/lib/cache";

dotenv.config({
  path: [".env.development.local", ".env.local", ".env.development", ".env"],
});

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Thiếu MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);

  const invalidFilter = {
    has_vietnamese_audio: { $ne: true },
    $and: [
      { $or: [{ subtitle_vtt: { $exists: false } }, { subtitle_vtt: "" }, { subtitle_vtt: null }] },
      { $or: [{ subtitle_srt: { $exists: false } }, { subtitle_srt: "" }, { subtitle_srt: null }] },
    ],
  };

  const before = {
    dramas: await Drama.countDocuments(),
    episodes: await Episode.countDocuments(),
  };
  const removedEpisodes = await Episode.deleteMany(invalidFilter);
  const remainingDramaIds = await Episode.distinct("dramaId");
  const orphanedDramas = await Drama.find({ _id: { $nin: remainingDramaIds } }).select("_id").lean();
  const orphanedIds = orphanedDramas.map((drama) => drama._id);
  const removedDramas = orphanedIds.length
    ? await Drama.deleteMany({ _id: { $in: orphanedIds } })
    : { deletedCount: 0 };
  if (orphanedIds.length) {
    await HeroSlide.deleteMany({
      dramaId: { $in: orphanedIds.map((id) => String(id)) },
    });
  }

  await deleteCacheByPattern("feed:*");
  await deleteCacheByPattern("public:dramas:*");
  await deleteCacheByPattern("drama:slug:*");

  const after = {
    dramas: await Drama.countDocuments(),
    episodes: await Episode.countDocuments(),
  };
  console.log(JSON.stringify({
    before,
    removedEpisodes: removedEpisodes.deletedCount,
    removedDramas: removedDramas.deletedCount,
    after,
  }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
