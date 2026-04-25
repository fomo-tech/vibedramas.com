#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔨 [1/3] Building production...");
try {
  execSync("npm run build", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Build failed");
  process.exit(1);
}

console.log("\n📦 [2/3] Creating deploy.zip...");

// Xóa file zip cũ nếu có
const zipFile = "deploy.zip";
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// Danh sách files/folders cần zip
const itemsToZip = [".next", "public", "src", "server.js"];

// Kiểm tra files tồn tại
const existingItems = itemsToZip.filter((item) => fs.existsSync(item));
const missingItems = itemsToZip.filter((item) => !fs.existsSync(item));

if (missingItems.length > 0) {
  console.warn("⚠️  Missing items (will skip):", missingItems.join(", "));
}

// Tạo zip command
const zipCommand = `zip -r ${zipFile} ${existingItems.join(" ")} -x "*.DS_Store" "*/__pycache__/*" "*.pyc"`;

try {
  execSync(zipCommand, { stdio: "inherit" });
} catch (error) {
  // zip exits non-zero when some files are unreadable (e.g. broken symlinks in .next).
  // Treat as success if the zip file was actually created with a reasonable size (> 1 MB).
  if (!fs.existsSync(zipFile) || fs.statSync(zipFile).size < 1024 * 1024) {
    console.error("❌ Zip failed");
    process.exit(1);
  }
  console.warn(
    "⚠️  Some files were skipped (unreadable), but zip was created successfully.",
  );
}

// Lấy kích thước file
const stats = fs.statSync(zipFile);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n✅ [3/3] Done! ${zipFile} (${fileSizeMB} MB)\n`);
console.log("── Upload lên VPS ──────────────────────────");
console.log(
  "scp deploy.zip root@172.104.178.174:/var/www/vibe-drama/ && ssh root@172.104.178.174 'cd /var/www/vibe-drama && unzip -o deploy.zip && pm2 restart vibe-drama && rm -f deploy.zip && pm2 logs vibe-drama --lines 100'",
);

console.log("");
