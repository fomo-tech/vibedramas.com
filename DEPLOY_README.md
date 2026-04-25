# 🚀 Quick Deploy Guide

## Cách dễ nhất (1 lệnh):

```bash
npm run deploy
```

Nhập:
- IP VPS
- Password (ẩn)
- Enter, Enter (dùng mặc định)

✅ Xong! App tự động build, upload và restart.

---

## Chi tiết đầy đủ:
Xem [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

---

## Requirements:

**Lần đầu chạy:**
```bash
# macOS
brew install hudochenkov/sshpass/sshpass

# Ubuntu
sudo apt-get install sshpass
```

**Check đã cài:**
```bash
which sshpass
# Phải thấy: /usr/local/bin/sshpass
```

---

## Các lệnh hay dùng:

```bash
# Deploy tự động (interactive)
npm run deploy

# Deploy nhanh (với password)
npm run deploy:password 203.0.113.10 mypassword

# Chỉ build ZIP (không upload)
npm run build:deploy

# Deploy với rsync (cần SSH key)
npm run deploy:full <IP>
```

---

## Troubleshooting nhanh:

### Lỗi "sshpass not found"
```bash
brew install hudochenkov/sshpass/sshpass
```

### Lỗi PM2 dev mode
```bash
# Trên VPS:
ssh root@<IP>
cd /var/www/vibe-drama
rm -rf .next
NODE_ENV=production npm run build
pm2 restart vibe-drama
```

### Check logs
```bash
ssh root@<IP> "pm2 logs vibe-drama --lines 50"
```
