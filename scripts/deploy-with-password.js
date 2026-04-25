#!/usr/bin/env node
/**
 * Deploy script với SSH password authentication
 * Usage: node scripts/deploy-with-password.js <VPS_IP> <PASSWORD> [USER] [PORT]
 */
const { execSync } = require("child_process");
const readline = require("readline");

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: node scripts/deploy-with-password.js <VPS_IP> <PASSWORD> [USER] [PORT]",
  );
  console.error(
    "Example: node scripts/deploy-with-password.js 203.0.113.10 mypassword root 22",
  );
  process.exit(1);
}

const VPS_IP = args[0];
const SSH_PASS = args[1];
const VPS_USER = args[2] || "root";
const SSH_PORT = args[3] || "22";
const APP_DIR = "/var/www/vibe-drama";

// Check sshpass installed
try {
  execSync("which sshpass", { stdio: "pipe" });
} catch (error) {
  console.error("❌ sshpass is not installed!");
  console.error("\nInstall it:");
  console.error("  macOS: brew install hudochenkov/sshpass/sshpass");
  console.error("  Ubuntu: sudo apt-get install sshpass");
  process.exit(1);
}

console.log("🚀 Starting deployment...\n");
console.log(`📍 Target: ${VPS_USER}@${VPS_IP}:${SSH_PORT}`);
console.log(`📁 App Dir: ${APP_DIR}\n`);

// Step 1: Build local
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📦 [1/5] Building production locally...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build completed\n");
} catch (error) {
  console.error("❌ Build failed");
  process.exit(1);
}

// Step 2: Create zip
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📦 [2/5] Creating deploy.zip...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const fs = require("fs");
if (fs.existsSync("deploy.zip")) {
  fs.unlinkSync("deploy.zip");
}

const itemsToZip = [
  ".next",
  "node_modules",
  "public",
  "src",
  "server.js",
  "ecosystem.config.js",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  ".env.production",
];

const existingItems = itemsToZip.filter((item) => fs.existsSync(item));
const zipCommand = `zip -r deploy.zip ${existingItems.join(" ")} -x "*.DS_Store"`;

try {
  execSync(zipCommand, { stdio: "pipe" });
  const stats = fs.statSync("deploy.zip");
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ deploy.zip created (${sizeMB} MB)\n`);
} catch (error) {
  console.error("❌ Failed to create zip");
  process.exit(1);
}

// Step 3: Upload to VPS
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📤 [3/5] Uploading to VPS...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const scpCommand = `sshpass -p '${SSH_PASS}' scp -P ${SSH_PORT} -o StrictHostKeyChecking=accept-new deploy.zip ${VPS_USER}@${VPS_IP}:${APP_DIR}/`;

try {
  execSync(scpCommand, { stdio: "inherit" });
  console.log("✅ Upload completed\n");
} catch (error) {
  console.error("❌ Upload failed");
  process.exit(1);
}

// Step 4: Extract and setup on VPS
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📦 [4/5] Extracting on VPS...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const setupCommands = `
cd ${APP_DIR} && \\
unzip -o deploy.zip && \\
rm deploy.zip && \\
if [ ! -f .env.local ]; then cp .env.production .env.local; fi && \\
echo "✅ Files extracted"
`;

const sshCommand = `sshpass -p '${SSH_PASS}' ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_IP} '${setupCommands}'`;

try {
  execSync(sshCommand, { stdio: "inherit" });
  console.log("\n");
} catch (error) {
  console.error("❌ Setup failed");
  process.exit(1);
}

// Step 5: Restart PM2
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔄 [5/5] Restarting PM2...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const restartCommands = `
cd ${APP_DIR} && \\
if pm2 describe vibe-drama >/dev/null 2>&1; then
  pm2 restart vibe-drama --update-env
else
  pm2 start ecosystem.config.js --env production
  pm2 save
fi && \\
echo "" && \\
pm2 status vibe-drama
`;

const restartCommand = `sshpass -p '${SSH_PASS}' ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_IP} '${restartCommands}'`;

try {
  execSync(restartCommand, { stdio: "inherit" });
  console.log("\n");
} catch (error) {
  console.error("❌ Restart failed");
  process.exit(1);
}

// Cleanup local zip
fs.unlinkSync("deploy.zip");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ Deployment completed successfully!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log(`🌐 Your app should be running at: https://${VPS_IP}`);
console.log(`\n📊 Check logs:`);
console.log(
  `   sshpass -p '${SSH_PASS}' ssh -p ${SSH_PORT} ${VPS_USER}@${VPS_IP} "pm2 logs vibe-drama --lines 50"`,
);
console.log("");
