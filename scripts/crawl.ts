import "dotenv/config";
import mongoose from "mongoose";
import {
  syncDramas,
  syncDramasFromKKPhim,
} from "../src/services/crawlerService";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vibe-drama";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("🔗 Connected to MongoDB");

  // ── OPhim ────────────────────────────────────────────────────────────────
  console.log("\n═══ Nguồn 1: OPhim ═══");
  const totalOPhim = await syncDramas(1, 37);
  console.log(`✅ OPhim: synced ${totalOPhim} dramas.`);

  // ── KKPhim ───────────────────────────────────────────────────────────────
  // Pass 999 as endPage — function will auto-cap to actual totalPages from API
  console.log("\n═══ Nguồn 2: KKPhim ═══");
  const totalKK = await syncDramasFromKKPhim(1, 999);
  console.log(`✅ KKPhim: synced ${totalKK} dramas.`);

  console.log(
    `\n🎉 Crawl Job Finished! Total: ${totalOPhim + totalKK} records processed.`,
  );
  console.log(
    "   (Phim trùng slug được merge tự động, không tạo bản ghi trùng)",
  );
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal Error:", e);
  process.exit(1);
});
