import "dotenv/config";
import mongoose from "mongoose";
import { syncDramasFromKKPhim } from "../src/services/crawlerService";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("🔗 Connected to MongoDB");

  console.log("\n═══ Crawl KKPhim (phimapi.com) — thể loại phim-ngan ═══");
  console.log(
    "📌 Phim trùng slug sẽ được merge (upsert), không tạo bản ghi mới.\n",
  );

  // Pass 999 — hàm tự detect totalPages từ API response
  const total = await syncDramasFromKKPhim(1, 999);

  console.log(`\n✅ KKPhim crawl xong! Đã sync ${total} phim.`);
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal Error:", e);
  process.exit(1);
});
