#!/usr/bin/env node
/**
 * Script copy các thư mục cần thiết để deploy (không build)
 * Usage: npm run copy:deploy
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = "deploy-package";

console.log(`📦 Copying deployment files to ${OUTPUT_DIR}/...\n`);

// Xóa thư mục cũ nếu có
if (fs.existsSync(OUTPUT_DIR)) {
  console.log(`🗑️  Removing old ${OUTPUT_DIR}/...`);
  execSync(`rm -rf ${OUTPUT_DIR}`, { stdio: "inherit" });
}

// Tạo thư mục mới
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Danh sách files/folders cần copy
const itemsToCopy = [
  { src: ".next", desc: "Built Next.js files" },
  { src: "node_modules", desc: "Dependencies" },
  { src: "public", desc: "Static assets" },
  { src: "src", desc: "Source code" },
  { src: "server.js", desc: "Custom server" },
  { src: "ecosystem.config.js", desc: "PM2 config" },
  { src: "package.json", desc: "Package manifest" },
  { src: "package-lock.json", desc: "Dependency lock" },
  { src: "next.config.ts", desc: "Next.js config" },
  { src: "tsconfig.json", desc: "TypeScript config" },
  { src: "postcss.config.mjs", desc: "PostCSS config" },
  { src: "eslint.config.mjs", desc: "ESLint config" },
  { src: "next-env.d.ts", desc: "Next.js types" },
  { src: ".env.production", desc: "Production env", optional: true },
];

let copiedCount = 0;
let skippedCount = 0;

itemsToCopy.forEach((item) => {
  const srcPath = item.src;
  const destPath = path.join(OUTPUT_DIR, item.src);

  if (!fs.existsSync(srcPath)) {
    if (!item.optional) {
      console.log(`⚠️  Missing: ${item.src} (${item.desc})`);
    }
    skippedCount++;
    return;
  }

  try {
    // Copy với rsync (giữ symlinks và permissions)
    const isDir = fs.statSync(srcPath).isDirectory();
    if (isDir) {
      execSync(`cp -R "${srcPath}" "${destPath}"`, { stdio: "pipe" });
    } else {
      execSync(`cp "${srcPath}" "${destPath}"`, { stdio: "pipe" });
    }
    console.log(`✓ Copied: ${item.src} (${item.desc})`);
    copiedCount++;
  } catch (error) {
    console.error(`✗ Failed to copy: ${item.src}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Copied: ${copiedCount} items`);
console.log(`   Skipped: ${skippedCount} items`);

// Tạo README trong deploy package
const readmePath = path.join(OUTPUT_DIR, "DEPLOY_README.txt");
const readmeContent = `
Deployment Package
==================

Created: ${new Date().toISOString()}

Installation Instructions:
--------------------------

1. Upload this folder to VPS:
   rsync -avz --delete deploy-package/ root@<IP>:/var/www/vibe-drama/

2. On VPS, run:
   cd /var/www/vibe-drama
   cp .env.production .env.local
   pm2 restart vibe-drama

3. Verify:
   pm2 logs vibe-drama
   pm2 status

Notes:
------
- Make sure .env.local is configured on VPS
- Check Node.js version: node -v (requires v18+)
- PM2 should be installed: npm install -g pm2
`;

fs.writeFileSync(readmePath, readmeContent.trim());

console.log(`\n✅ Done! Package ready at: ${OUTPUT_DIR}/`);
console.log(`\n📤 To upload to VPS:`);
console.log(
  `   rsync -avz --delete ${OUTPUT_DIR}/ root@<IP>:/var/www/vibe-drama/`,
);
console.log("");
