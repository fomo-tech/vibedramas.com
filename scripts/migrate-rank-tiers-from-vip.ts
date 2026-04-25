import "dotenv/config";
import mongoose from "mongoose";
import RankConfig from "../src/models/RankConfig";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    apply: args.has("--apply"),
  };
}

async function run() {
  const { apply } = parseArgs();

  await mongoose.connect(MONGODB_URI);
  console.log("🔗 Connected to MongoDB");

  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection not ready");
  }

  const legacyPackagesCollection =
    mongoose.connection.db.collection("vippackages");

  const [ranks, packages] = await Promise.all([
    RankConfig.find().sort({ rank: 1 }).lean(),
    legacyPackagesCollection.find({}).sort({ order: 1, price: 1 }).toArray(),
  ]);

  if (!ranks.length) {
    console.log("ℹ️ No RankConfig records found. Nothing to migrate.");
    process.exit(0);
  }

  if (!packages.length) {
    console.log("ℹ️ No VipPackage records found. Nothing to map from.");
    process.exit(0);
  }

  const updates = ranks.map((rank, index) => {
    const directMatch = packages.find(
      (p) => Number(p.giftRank) === Number(rank.rank),
    );
    const fallbackMatch = packages[index] ?? packages[packages.length - 1];
    const source = directMatch ?? fallbackMatch;

    const next = {
      price: Number(source.price ?? rank.price ?? 0),
      days: Number(source.days ?? rank.days ?? 30),
      coinsPerMinute: Number(source.coinsPerMinute ?? rank.coinsPerMinute ?? 1),
      isActive: source.isActive !== false,
      order: Number(source.order ?? rank.order ?? rank.rank),
      badge: source.badge || undefined,
      badgeVariant:
        source.badgeVariant === "popular" || source.badgeVariant === "best"
          ? source.badgeVariant
          : undefined,
    };

    return {
      id: String(rank._id),
      rank: Number(rank.rank),
      name: rank.name,
      sourceName: source.name,
      next,
    };
  });

  console.log("\n📋 Rank tier mapping preview");
  for (const item of updates) {
    console.log(
      `- Rank ${item.rank} (${item.name}) <= ${item.sourceName} | price=${item.next.price}, days=${item.next.days}, coins/min=${item.next.coinsPerMinute}`,
    );
  }

  if (!apply) {
    console.log("\n🧪 Dry-run mode. No changes were written.");
    console.log("Run with --apply to write updates.");
    process.exit(0);
  }

  const bulkOps = updates.map((item) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(item.id) },
      update: { $set: item.next },
    },
  }));

  const result = await RankConfig.bulkWrite(bulkOps, { ordered: false });
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
