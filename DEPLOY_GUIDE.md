# 🚀 Deployment Scripts Guide

## 📋 Tổng quan

Có 2 cách deploy chính:
1. **Tự động** - Build local + upload với password SSH
2. **Thủ công** - Build ZIP, upload manual

---

## 🔥 Deploy Tự Động (Khuyên Dùng)

### Option 1: Interactive Mode (An toàn nhất)
```bash
npm run deploy
```

**Prompts:**
```
VPS IP Address: [nhập IP]
SSH Password: [gõ password - ẩn với ***]
SSH User (default: root): [Enter hoặc nhập user]
SSH Port (default: 22): [Enter hoặc nhập port]
```

**Tự động thực hiện:**
- ✅ Build production local
- ✅ Tạo deploy.zip (100-200MB)
- ✅ Upload qua SSH với password
- ✅ Extract trên VPS
- ✅ Setup .env.local (nếu chưa có)
- ✅ Restart PM2 tự động
- ✅ Show status

---

### Option 2: Command Line (Nhanh)
```bash
npm run deploy:password <IP> <PASSWORD> [USER] [PORT]
```

**Examples:**
```bash
# Basic
npm run deploy:password 203.0.113.10 mypassword

# Full options
npm run deploy:password 203.0.113.10 mypassword root 22

# Custom user/port
npm run deploy:password 45.76.213.159 secret ubuntu 2222
```

---

## 📦 Deploy Thủ Công

### Bước 1: Build và tạo ZIP
```bash
npm run build:deploy
```

**Output:** `deploy.zip` (~100-200MB)

**Bao gồm:**
- `.next/` - Production build
- `node_modules/` - Dependencies
- `public/` - Static files
- `src/` - Source code
- `server.js` - Custom server
- `ecosystem.config.js` - PM2 config
- Config files (package.json, next.config.ts, etc.)

---

### Bước 2: Upload lên VPS
```bash
scp deploy.zip root@<IP_VPS>:/var/www/vibe-drama/
```

---

### Bước 3: Deploy trên VPS
```bash
ssh root@<IP_VPS>

cd /var/www/vibe-drama
unzip -o deploy.zip
rm deploy.zip

# Setup env (lần đầu)
cp .env.production .env.local
nano .env.local  # Edit với credentials thật

# Restart
pm2 restart vibe-drama --update-env
pm2 logs vibe-drama
```

---

## 🛠️ Requirements

### macOS/Linux:
```bash
# Check installed
which sshpass
which zip
which ssh

# Install sshpass (cho deploy tự động)
# macOS:
brew install hudochenkov/sshpass/sshpass

# Ubuntu:
sudo apt-get install sshpass
```

### VPS cần có:
- Node.js 18+ (`node -v`)
- PM2 (`npm install -g pm2`)
- Thư mục `/var/www/vibe-drama`
- File `.env.local` với credentials thật

---

## 📊 So sánh các phương pháp

| Phương pháp | Ưu điểm | Nhược điểm | Thời gian |
|-------------|---------|------------|-----------|
| `npm run deploy` | ✅ Tự động hoàn toàn<br>✅ Password ẩn<br>✅ An toàn | ⚠️ Cần sshpass | ~3-5 phút |
| `npm run deploy:password` | ✅ Nhanh<br>✅ Một lệnh | ⚠️ Password trên CLI | ~3-5 phút |
| `npm run build:deploy` + manual | ✅ Kiểm soát cao<br>✅ Không cần sshpass | ⚠️ Nhiều bước | ~5-10 phút |
| `npm run deploy:full` (rsync) | ✅ Sync incremental<br>✅ Nhanh nhất | ⚠️ Cần SSH key | ~2-3 phút |

---

## 🎯 Use Cases

### Deploy lần đầu
```bash
npm run deploy
# Hoặc
npm run deploy:full <IP>
```

### Update code thường xuyên
```bash
# Nhanh nhất (chỉ sync .next)
npm run deploy:next <IP> root 22 <password>

# Hoặc full deploy
npm run deploy
```

### Emergency fix
```bash
# Build + deploy trong 1 lệnh
npm run deploy:password <IP> <PASS>
```

### Backup/Transfer
```bash
npm run build:deploy
# Lưu deploy.zip vào cloud storage
```

---

## 🐛 Troubleshooting

### "sshpass not found"
```bash
# macOS
brew install hudochenkov/sshpass/sshpass

# Ubuntu
sudo apt-get install sshpass
```

### "Permission denied"
```bash
# Check SSH credentials
ssh root@<IP>

# Check file permissions
ls -la scripts/*.js
chmod +x scripts/*.js
```

### "Build failed"
```bash
# Clean và rebuild
npm run clean
npm run build
```

### "PM2 vẫn chạy dev mode"
```bash
# Trên VPS
cd /var/www/vibe-drama
rm -rf .next
NODE_ENV=production npm run build
pm2 delete vibe-drama
pm2 start ecosystem.config.js --env production
pm2 save
```

### "MONGODB_URI not set"
```bash
# Trên VPS
cd /var/www/vibe-drama
cat .env.local | grep MONGODB_URI

# Nếu không có file
cp .env.production .env.local
nano .env.local  # Paste credentials thật
pm2 restart vibe-drama --update-env
```

---

## 📝 VPS Initial Setup

### Lần đầu setup VPS:
```bash
# 1. SSH vào VPS
ssh root@<IP>

# 2. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Tạo thư mục app
mkdir -p /var/www/vibe-drama
cd /var/www/vibe-drama

# 5. Setup PM2 auto-start
pm2 startup
# (chạy lệnh mà PM2 suggest)

# 6. Tạo logs folder
mkdir -p logs

# 7. Setup .env.local
nano .env.local
# (paste production credentials)
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Dùng `npm run deploy` (interactive) cho security
- Tạo `.env.local` riêng trên VPS với credentials thật
- Backup `.env.local` vào password manager
- Đổi SSH password định kỳ
- Dùng SSH key thay vì password khi có thể

### ❌ DON'T:
- KHÔNG commit `.env.local` vào git
- KHÔNG để password trong bash history
- KHÔNG share `.env.local` qua chat/email
- KHÔNG dùng credentials giống nhau cho dev/prod

---

## 📞 Support Commands

### Check logs
```bash
ssh root@<IP> "pm2 logs vibe-drama --lines 50"
```

### Check status
```bash
ssh root@<IP> "pm2 status && pm2 show vibe-drama"
```

### Restart remote
```bash
ssh root@<IP> "cd /var/www/vibe-drama && pm2 restart vibe-drama"
```

### Manual deploy test
```bash
ssh root@<IP> "cd /var/www/vibe-drama && NODE_ENV=production node server.js"
```

---

## 🎓 Examples

### Deploy to production
```bash
npm run deploy
# VPS IP: 203.0.113.10
# Password: ********
# User: root
# Port: 22
```

### Deploy to staging
```bash
npm run deploy:password 203.0.113.20 staging_pass ubuntu 2222
```

### Quick update
```bash
npm run deploy:next 203.0.113.10 root 22 mypass
```

---

**Made with ❤️ for Vibe Drama**
