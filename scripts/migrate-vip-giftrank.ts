import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

const MAX_GIFT_RANK = 5;

function clampRank(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_GIFT_RANK, Math.max(1, Math.floor(value)));
}

function inferRankFromName(name: string): number | null {
  const normalized = name.toLowerCase();

  // Match explicit phrases like "rank 3", "bậc 4", "level 2", "lvl5"
  const match = normalized.match(/(?:rank|b(?:ac|ậc)|level|lvl)\s*(\d+)/i);
  if (match?.[1]) {
    return clampRank(Number(match[1]));
  }

  // Named heuristics fallback
  if (/(legend|huyen thoai|huyền thoại)/i.test(normalized)) return 5;
  if (/(premium|max|ultra|pro)/i.test(normalized)) return 4;
  if (/(plus|gold|vip\s*\+)/i.test(normalized)) return 3;
  if (/(basic|starter|co ban|cơ bản)/i.test(normalized)) return 1;

  return null;
}

function inferRankByPrice(price: number): number {
  if (price >= 5000) return 5;
  if (price >= 2500) return 4;
  if (price >= 1200) return 3;
  if (price >= 500) return 2;
  return 1;
}

function inferGiftRank(pkg: { name?: string; price?: number }): number {
  const fromName = inferRankFromName(pkg.name ?? "");
  if (fromName) return fromName;
  return inferRankByPrice(Number(pkg.price ?? 0));
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    apply: args.has("--apply"),
    force: args.has("--force"),
  };
}

async function run() {
  const { apply, force } = parseArgs();

  await mongoose.connect(MONGODB_URI);
  console.log("🔗 Connected to MongoDB");

  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection not ready");
  }

  const legacyCollection = mongoose.connection.db.collection("vippackages");

  const packages = await legacyCollection
    .find({})
    .sort({ price: 1, order: 1 })
    .toArray();

  if (!packages.length) {
    console.log("ℹ️ No VIP packages found. Nothing to migrate.");
    process.exit(0);
  }

  const plans = packages.map((pkg) => {
    const current = Number(pkg.giftRank ?? 0);
    const inferred = inferGiftRank({ name: pkg.name, price: pkg.price });
    const validCurrent = current >= 1 && current <= MAX_GIFT_RANK;
    const next = force || !validCurrent ? inferred : current;
    const shouldUpdate = next !== current;

    return {
      id: String(pkg._id),
      name: pkg.name,
      price: Number(pkg.price ?? 0),
      current,
      next,
      shouldUpdate,
    };
  });

  const needUpdate = plans.filter((p) => p.shouldUpdate);

  console.log("\n📦 VIP package giftRank migration preview");
  for (const plan of plans) {
    const marker = plan.shouldUpdate ? "→" : "=";
    console.log(
      `- ${plan.name} (price: ${plan.price}) giftRank ${plan.current || "(empty)"} ${marker} ${plan.next}`,
    );
  }

  console.log(
    `\nSummary: ${plans.length} packages, ${needUpdate.length} updates`,
  );

  if (!apply) {
    console.log("\n🧪 Dry-run mode. No changes were written.");
    console.log("Run with --apply to write updates.");
    process.exit(0);
  }

  if (!needUpdate.length) {
    console.log("\n✅ Nothing to update.");
    process.exit(0);
  }

  const bulkOps = needUpdate.map((plan) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(plan.id) },
      update: { $set: { giftRank: plan.next } },
    },
  }));

  const result = await legacyCollection.bulkWrite(bulkOps, { ordered: false });

  console.log("\n✅ Migration applied");
  console.log(
    `Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`,
  );

  process.exit(0);
}

run().catch((error) => {
  console.error("❌ Migration failed", error);
  process.exit(1);
});
