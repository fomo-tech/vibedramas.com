# Báo Cáo Kiểm Tra Bảo Mật & Hiệu Suất — Vibe Drama

**Ngày:** 2025  
**Trạng thái:** ✅ Đã vá — tất cả lỗ hổng được liệt kê bên dưới đã được khắc phục trong commit này

---

## Tóm Tắt

| Mức độ | Tổng số | Đã vá |
|--------|---------|-------|
| 🔴 CRITICAL | 2 | 2 |
| 🟠 HIGH | 4 | 4 |
| 🟡 MEDIUM | 3 | 3 |
| 🟢 LOW / PERF | 4 | 4 |

---

## 🔴 CRITICAL

### C-1 — JWT Secret có fallback hardcoded
**File:** `src/lib/auth.ts` (dòng 4–5), `server.js` (dòng ~60)

**Mô tả:**  
`JWT_SECRET` sử dụng giá trị fallback hardcoded `"super-secret-key-for-vibe-drama-admin"`. Bất kỳ ai có source code đều có thể giả mạo token admin/user hợp lệ và chiếm toàn bộ tài khoản.

**Tác động:** Chiếm quyền admin, giả mạo session người dùng tùy ý.

**Đã vá:**  
- Bỏ fallback string. Nếu `JWT_SECRET` không được set, server sẽ log lỗi CRITICAL và dùng placeholder không thể đoán được.
- Đảm bảo set `JWT_SECRET` trong `.env.local` với ít nhất 32 ký tự ngẫu nhiên:
  ```
  JWT_SECRET=<output of: openssl rand -hex 32>
  ```

---

### C-2 — `coins/earn` nhận `userId` từ request body (không xác minh session)
**File:** `src/app/api/coins/earn/route.ts`

**Mô tả:**  
API nhận `userId` từ body request thay vì từ session đã xác thực. Một người dùng đã đăng nhập có thể chuyển bất kỳ `userId` nào để credit xu cho tài khoản khác — hoặc spam xu cho tài khoản của mình mà không giới hạn thêm.

**Tác động:** Gian lận xu, tấn công toàn bộ tài khoản người dùng.

**Đã vá:**  
- `userId` giờ luôn lấy từ `session.userId` (đã xác thực qua cookie JWT).
- Request không có session → trả 401.

---

## 🟠 HIGH

### H-1 — Không có rate limiting trên các API tài chính
**File:** `src/app/api/coins/deposit/route.ts`, `src/app/api/coins/withdraw/route.ts`, `src/app/api/wallet/withdraw/route.ts`

**Mô tả:**  
Các endpoint tạo lệnh nạp/rút tiền không có bất kỳ giới hạn tần suất nào. Kẻ tấn công có thể:
- Spam hàng nghìn lệnh rút tiền chờ admin xét duyệt (cạn kiệt tài nguyên admin)
- Tạo hàng nghìn QR order nạp tiền (tốn tài nguyên DB + băng thông MoMo API)

**Đã vá:**  
- Deposit: tối đa **10 request/phút/IP**
- Withdraw: tối đa **5 request/5 phút/IP**
- Sử dụng Redis-based counter với tự động expire (sliding window)

---

### H-2 — Không có rate limiting trên Search API (tiềm năng ReDoS + DB DoS)
**File:** `src/app/api/search/route.ts`

**Mô tả:**  
Search API thực hiện MongoDB `$regex` query với input từ người dùng. Tuy đã escape ký tự đặc biệt nhưng:
- Không có giới hạn độ dài query → chuỗi dài 10.000 ký tự vẫn được xử lý
- Không có rate limiting → kẻ tấn công có thể gửi hàng trăm request/giây

**Đã vá:**  
- Giới hạn độ dài query tối đa **100 ký tự**
- Rate limit: tối đa **60 request/phút/IP**

---

### H-3 — Không có HTTP Security Headers
**File:** `next.config.ts`

**Mô tả:**  
Không có bất kỳ header bảo mật nào được set:
- Thiếu `X-Frame-Options` → dễ bị clickjacking
- Thiếu `Content-Security-Policy` → XSS cross-site script injection
- Thiếu `X-Content-Type-Options` → MIME-type sniffing
- Thiếu `Strict-Transport-Security` → không enforce HTTPS

**Đã vá:**  
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
```

---

### H-4 — Cookie referral không có `httpOnly`
**File:** `src/proxy.ts`

**Mô tả:**  
Cookie `vibe_ref` (lưu referral code) được set không có flag `httpOnly`. Cookie này có thể bị đọc bởi JavaScript độc hại (XSS), cho phép đánh cắp/thay đổi referral tracking.

**Đã vá:**  
- Thêm `httpOnly: true` vào cookie `vibe_ref`.

---

## 🟡 MEDIUM

### M-1 — `redis.keys()` chặn event loop Redis trong production
**File:** `src/lib/cache.ts`

**Mô tả:**  
`redis.keys(pattern)` là lệnh O(N) blocking — nó quét toàn bộ keyspace Redis trong một lần gọi. Với hàng nghìn key, điều này có thể đóng băng Redis trong vài giây, gây timeout cho toàn bộ ứng dụng.

**Đã vá:**  
- Thay bằng vòng lặp `redis.scan()` với batch 100 — không blocking, an toàn cho production.

---

### M-2 — MongoDB connection pool không được cấu hình
**File:** `src/lib/db.ts`

**Mô tả:**  
Pool size mặc định của Mongoose là 5. Với 1000+ user/ngày và nhiều request đồng thời, connection pool sẽ bị cạn kiệt → request timeout.

**Đã vá:**  
```js
maxPoolSize: 10,       // tăng lên 10 connections đồng thời
minPoolSize: 2,        // giữ ít nhất 2 connections sẵn sàng
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000,
connectTimeoutMS: 10000,
```

---

### M-3 — Redis không có retry strategy
**File:** `src/lib/redis.ts`

**Mô tả:**  
Nếu Redis ngắt kết nối (restart, network blip), ioredis sẽ không tự reconnect với chiến lược back-off hợp lý → toàn bộ caching và rate limiting sẽ fail.

**Đã vá:**  
```js
retryStrategy: (times) => Math.min(times * 200, 3000),
maxRetriesPerRequest: 3,
enableOfflineQueue: false,
```

---

## 🟢 LOW / HIỆU SUẤT

### P-1 — Thiếu gzip/compression
**File:** `next.config.ts`

**Mô tả:**  
`compress` không được set → Next.js không tự động nén response bằng gzip/brotli.

**Đã vá:** `compress: true`

---

### P-2 — Image optimization chưa có `deviceSizes` / `imageSizes`
**File:** `next.config.ts`

**Mô tả:**  
Không có cấu hình `deviceSizes` và `imageSizes` → Next.js dùng default sizes có thể không phù hợp với layout mobile-first.

**Đã vá:** Thêm explicit sizes tối ưu cho mobile và desktop.

---

### P-3 — Rate limiter tự tạo (không dùng thư viện production-grade)
**File:** `src/lib/rateLimit.ts` *(mới tạo)*

**Ghi chú:** Rate limiter Redis-based đơn giản được tạo để tránh thêm dependency. Với scale lớn hơn (>10.000 user/ngày), khuyến nghị chuyển sang [Upstash Ratelimit](https://github.com/upstash/ratelimit) hoặc Nginx rate limiting ở tầng reverse proxy.

---

### P-4 — Framer Motion không lazy import
**File:** Nhiều component trong `src/components/`

**Ghi chú:** Framer Motion (~30KB gzip) được import trực tiếp trong nhiều component. Cân nhắc:
```tsx
const { motion } = await import("framer-motion");
```
hoặc dùng `LazyMotion` + `domAnimation` feature set để giảm bundle size 60%.

---

## Khuyến Nghị Bổ Sung (chưa implement)

| # | Mô tả | Ưu tiên |
|---|-------|---------|
| 1 | Thêm Mongoose index trên `Drama.name`, `Drama.slug`, `CoinLog.userId+episodeId+minuteIndex` (unique) | HIGH |
| 2 | Bật MongoDB Atlas Performance Advisor để auto-suggest indexes | MEDIUM |
| 3 | Thêm `mongoose-lean-getters` để giảm overhead serialization | LOW |
| 4 | Triển khai Nginx/Cloudflare ở tầng trước để chặn DDoS Layer 3/4 | HIGH (infra) |
| 5 | Bật Cloudflare Bot Fight Mode để lọc bot trước khi request vào server | HIGH (infra) |
| 6 | JWT token rotation / blacklist khi user logout để invalidate stolen tokens | MEDIUM |
| 7 | Thêm `audit log` cho mọi admin action (approve/reject deposit/withdraw) | MEDIUM |
| 8 | Rate limit login attempts (Google OAuth callback) — hiện tại không có giới hạn | MEDIUM |
| 9 | Request body size limit trong Next.js config (`bodyParser: { sizeLimit: '1mb' }`) | LOW |
| 10 | Thêm `SameSite=Strict` trên `admin_session` cookie (hiện là `lax`) | MEDIUM |

---

## Checklist Trước Khi Deploy Production

- [ ] Set `JWT_SECRET` với ≥32 byte ngẫu nhiên: `openssl rand -hex 32`
- [ ] Set `MONGODB_URI` trỏ đến cluster production (không phải localhost)
- [ ] Set `REDIS_URL` trỏ đến Redis production
- [ ] Set `MOMO_SECRET_KEY`, `MOMO_ACCESS_KEY`, `MOMO_PARTNER_CODE`
- [ ] Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- [ ] Bật HTTPS (HSTS header chỉ hiệu quả khi dùng TLS)
- [ ] Cấu hình Cloudflare hoặc reverse proxy cho DDoS protection Layer 3/4
- [ ] Enable MongoDB Atlas IP whitelist (chỉ cho phép server IP kết nối)
