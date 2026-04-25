#!/usr/bin/env node
/**
 * Deploy script với interactive prompts (an toàn hơn)
 * Usage: npm run deploy
 */
const { execSync } = require("child_process");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function hiddenQuestion(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.resume();
    process.stdout.write(query);

    let password = "";
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    const onData = (char) => {
      char = char.toString("utf8");

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode(false);
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u007f": // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 Vibe Drama Deployment Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Get deployment info
  const VPS_IP = await question("VPS IP Address: ");
  const SSH_PASS = await hiddenQuestion("SSH Password: ");
  const VPS_USER = (await question("SSH User (default: root): ")) || "root";
  const SSH_PORT = (await question("SSH Port (default: 22): ")) || "22";
  const APP_DIR = "/var/www/vibe-drama";

  rl.close();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Deployment Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Target: ${VPS_USER}@${VPS_IP}:${SSH_PORT}`);
  console.log(`App Dir: ${APP_DIR}`);
  console.log(`Password: ${"*".repeat(SSH_PASS.length)}\n`);

  // Check sshpass
  try {
    execSync("which sshpass", { stdio: "pipe" });
  } catch (error) {
    console.error("❌ sshpass is not installed!");
    console.error("\nInstall it:");
    console.error("  macOS: brew install hudochenkov/sshpass/sshpass");
    console.error("  Ubuntu: sudo apt-get install sshpass");
    process.exit(1);
  }

  // Step 1: Build
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 [1/5] Building production...");
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

  if (fs.existsSync("deploy.zip")) fs.unlinkSync("deploy.zip");

  const items = [
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
  ].filter((item) => fs.existsSync(item));

  execSync(`zip -r deploy.zip ${items.join(" ")} -x "*.DS_Store"`, {
    stdio: "pipe",
  });
  const sizeMB = (fs.statSync("deploy.zip").size / (1024 * 1024)).toFixed(2);
  console.log(`✅ deploy.zip created (${sizeMB} MB)\n`);

  // Step 3: Upload
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📤 [3/5] Uploading to VPS...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  execSync(
    `sshpass -p '${SSH_PASS}' scp -P ${SSH_PORT} -o StrictHostKeyChecking=accept-new deploy.zip ${VPS_USER}@${VPS_IP}:${APP_DIR}/`,
    { stdio: "inherit" },
  );
  console.log("✅ Upload completed\n");

  // Step 4: Extract
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 [4/5] Extracting on VPS...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  execSync(
    `sshpass -p '${SSH_PASS}' ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && unzip -o deploy.zip && rm deploy.zip && if [ ! -f .env.local ]; then cp .env.production .env.local; fi'`,
    { stdio: "inherit" },
  );
  console.log("✅ Files extracted\n");

  // Step 5: Restart PM2
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔄 [5/5] Restarting PM2...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  execSync(
    `sshpass -p '${SSH_PASS}' ssh -p ${SSH_PORT} ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && if pm2 describe vibe-drama >/dev/null 2>&1; then pm2 restart vibe-drama --update-env; else pm2 start ecosystem.config.js --env production && pm2 save; fi && pm2 status vibe-drama'`,
    { stdio: "inherit" },
  );

  // Cleanup
  fs.unlinkSync("deploy.zip");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Deployment completed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
});
