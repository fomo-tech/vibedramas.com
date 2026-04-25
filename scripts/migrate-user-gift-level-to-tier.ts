import "dotenv/config";
import mongoose from "mongoose";
import RankConfig from "../src/models/RankConfig";
import User from "../src/models/User";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return { apply: args.has("--apply") };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

type RankEntry = {
  rank: number;
};

function mapLegacyLevelToRank(level: number, ranks: RankEntry[]): number {
  const maxRank = Math.max(...ranks.map((item) => item.rank), 1);

  // Keep values already in tier range unchanged to avoid remapping migrated users.
  if (level >= 1 && level <= maxRank) {
    return Math.floor(level);
  }

  return Math.min(maxRank, Math.max(1, Math.floor(level)));
}

async function run() {
  const { apply } = parseArgs();

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const ranks = await RankConfig.find({}, { rank: 1 }).sort({ rank: 1 }).lean();

  if (!ranks.length) {
    console.log("No rank config found. Abort.");
    process.exit(1);
  }

  const normalizedRanks: RankEntry[] = ranks
    .map((item) => ({
      rank: Number(item.rank),
    }))
    .filter((item) => isFiniteNumber(item.rank) && item.rank >= 1)
    .sort((a, b) => a.rank - b.rank);

  const users = await User.find({}, { giftLevel: 1 }).lean();

  if (!users.length) {
    console.log("No users found. Nothing to migrate.");
    process.exit(0);
  }

  const plans = users.map((user) => {
    const currentLevel = Number(user.giftLevel ?? 1);
    const safeLevel = Number.isFinite(currentLevel) ? currentLevel : 1;
    const nextLevel = mapLegacyLevelToRank(safeLevel, normalizedRanks);

    const shouldUpdate = safeLevel !== nextLevel;

    return {
      id: String(user._id),
      currentLevel: safeLevel,
      nextLevel,
      shouldUpdate,
    };
  });

  const updates = plans.filter((item) => item.shouldUpdate);

  console.log(`Users scanned: ${plans.length}`);
  console.log(`Users to update: ${updates.length}`);

  for (const row of updates.slice(0, 30)) {
    console.log(
      `- ${row.id}: giftLevel ${row.currentLevel} -> ${row.nextLevel}`,
    );
  }
  if (updates.length > 30) {
    console.log(`... and ${updates.length - 30} more`);
  }

  if (!apply) {
    console.log("Dry-run mode. Re-run with --apply to write changes.");
    process.exit(0);
  }

  if (!updates.length) {
    console.log("Nothing to update.");
    process.exit(0);
  }

  const bulkOps = updates.map((item) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(item.id) },
      update: {
        $set: {
          giftLevel: item.nextLevel,
        },
      },
    },
  }));

  const result = await User.bulkWrite(bulkOps, { ordered: false });
  console.log(
    `Migration applied. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`,
  );

  process.exit(0);
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
