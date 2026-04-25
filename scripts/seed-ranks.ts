import "dotenv/config";
import mongoose from "mongoose";
import RankConfig from "../src/models/RankConfig";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

const NEW_RANKS = [
  {
    rank: 1,
    name: "Khán Giả",
    coinsReward: 10,
    watchSeconds: 60,
    price: 0,
    days: 30,
    coinsPerMinute: 1,
    isActive: true,
    order: 1,
  },
  {
    rank: 2,
    name: "Fan Cứng",
    coinsReward: 20,
    watchSeconds: 55,
    price: 500,
    days: 30,
    coinsPerMinute: 1.2,
    isActive: true,
    order: 2,
    badge: "Phổ biến",
    badgeVariant: "popular",
  },
  {
    rank: 3,
    name: "Sao Nổi",
    coinsReward: 35,
    watchSeconds: 50,
    price: 1200,
    days: 30,
    coinsPerMinute: 1.6,
    isActive: true,
    order: 3,
  },
  {
    rank: 4,
    name: "Minh Tinh",
    coinsReward: 55,
    watchSeconds: 45,
    price: 2500,
    days: 30,
    coinsPerMinute: 2,
    isActive: true,
    order: 4,
  },
  {
    rank: 5,
    name: "Huyền Thoại",
    coinsReward: 80,
    watchSeconds: 40,
    price: 5000,
    days: 30,
    coinsPerMinute: 3,
    isActive: true,
    order: 5,
    badge: "Best",
    badgeVariant: "best",
  },
];

async function seedRanks() {
  await mongoose.connect(MONGODB_URI);
  console.log("🔗 Connected to MongoDB");

  for (const r of NEW_RANKS) {
    const res = await RankConfig.findOneAndUpdate({ rank: r.rank }, r, {
      upsert: true,
      new: true,
    });
    console.log(`✅ Rank ${res.rank}: ${res.name}`);
  }

  console.log("\n🎉 Rank config seeded successfully!");
  process.exit(0);
}

seedRanks().catch(console.error);
