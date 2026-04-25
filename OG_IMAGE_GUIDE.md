# 🎨 OG Image - Vibe Drama

## ✅ Cải thiện hoàn thành

### 1. **Logo VD chính thức**
- ✅ Hiển thị đầy đủ logo "VD" của app
- ✅ Chữ V màu trắng (#FFFFFF)
- ✅ Chữ D gradient cam (#FF7B2D → #FF4500)
- ✅ Background tối với viền cam (#FF4500) opacity 40%

### 2. **Màu sắc đúng brand**
- ✅ Background: Dark gradient (#0D0D0D → #1A0A06 → #000000)
- ✅ Accent color: Orange-red (#FF4500) - khớp với logo
- ✅ Glow effects: Radial gradient cam (#FF4500)
- ✅ Không còn màu hồng (#FF2A6D) ❌

### 3. **Nội dung đầy đủ**
- ✅ Title: "Vibe Drama"
- ✅ Subtitle: "Xem Phim Ngắn, Phim Bộ Hay 2026"
- ✅ Features: Chất lượng HD • Cập nhật liên tục • Miễn phí
- ✅ Categories badges: Trung Quốc, Hàn Quốc, Thái Lan
- ✅ Domain: vibedramas.com

### 4. **Design chuyên nghiệp**
- ✅ Dimensions: 1200x630px (Facebook/Twitter recommended)
- ✅ Grid pattern trang trí
- ✅ Glow effects cho depth
- ✅ Typography rõ ràng
- ✅ Brand-consistent colors

---

## 📁 Files

### Current OG Image:
```
/public/icons/og-image.svg
```

**Format:** SVG (vector)  
**Size:** 1200x630px  
**Optimization:** Facebook/Twitter/LinkedIn compatible

### Trong code:
```typescript
// src/lib/seo.ts
ogImage: "/icons/og-image.svg"

// src/app/layout.tsx
themeColor: "#FF4500"

// public/manifest.json
"theme_color": "#FF4500"
```

---

## 🎨 Brand Colors (Updated)

### Primary Palette:
```css
--color-primary: #FF4500      /* Orange-red (main brand) */
--color-secondary: #FF6B2B    /* Lighter orange */
--color-vibe-orange: #FF7B2D  /* Logo D gradient start */
```

### Dark Theme:
```css
--background: #000000
--card-bg: #0F172A
--surface: rgba(255, 255, 255, 0.05)
```

### Logo Colors:
```
V: #FFFFFF (white)
D: linear-gradient(#FF7B2D → #FF4500)
Background: #1A0A06 → #0D0D0D
Border: #FF4500 40% opacity
```

---

## 🔄 Convert SVG → PNG (Optional)

Nếu cần PNG instead of SVG:

### Option 1: Online Tool
```
1. Mở: https://cloudconvert.com/svg-to-png
2. Upload: og-image.svg
3. Width: 1200px, Height: 630px
4. Download → save as og-image.png
```

### Option 2: Command Line (macOS)
```bash
# Cài đặt librsvg (nếu chưa có)
brew install librsvg

# Convert
rsvg-convert -w 1200 -h 630 \
  public/icons/og-image.svg \
  -o public/icons/og-image.png

# Optimize PNG
pngquant public/icons/og-image.png --output public/icons/og-image.png --force
```

### Option 3: Figma/Photoshop
```
1. Import og-image.svg
2. Export as PNG
3. Size: 1200x630px
4. Quality: 90-100%
```

### Sau khi có PNG:
```typescript
// Update src/lib/seo.ts
ogImage: "/icons/og-image.png"
```

---

## ✅ Testing

### 1. Facebook Debugger
```
https://developers.facebook.com/tools/debug/

Test URL: https://vibedramas.com
```

**Expected:**
- ✅ Image preview with VD logo
- ✅ Title + Description
- ✅ 1200x630 dimensions
- ✅ Dark background với logo cam

### 2. Twitter Card Validator
```
https://cards-dev.twitter.com/validator

Test URL: https://vibedramas.com
```

**Expected:**
- ✅ summary_large_image card
- ✅ VD logo visible
- ✅ Orange-red branding
- ✅ Clean preview

### 3. LinkedIn Post Inspector
```
https://www.linkedin.com/post-inspector/

Test URL: https://vibedramas.com
```

**Expected:**
- ✅ Professional OG image
- ✅ Logo + branding clear
- ✅ No errors

---

## 🎯 Visual Preview

### Layout:
```
┌────────────────────────────────────────────┐
│  [Dark gradient background]                │
│                                            │
│  [VD Logo]                                 │
│   Large                                    │
│   180x180                                  │
│                                            │
│         Vibe Drama                         │
│         Xem Phim Ngắn, Phim Bộ Hay 2026   │
│                                            │
│         ● HD  ● Liên tục  ● Miễn phí      │
│         ─────────────────────────────      │
│         [Trung Quốc] [Hàn Quốc] [Thái]    │
│                                            │
│         vibedramas.com                     │
└────────────────────────────────────────────┘
```

### Colors in image:
- Background: #000000 → #1A0A06 (dark gradient)
- Logo box: #1A0A06 with #FF4500 border
- V letter: #FFFFFF (white)
- D letter: #FF7B2D → #FF4500 (gradient)
- Glow: #FF4500 radial with 30% opacity
- Text: White với various opacities
- Badges: #FF4500 border + fill
- Accent line: #FF4500

---

## 📊 Specs

| Property | Value |
|----------|-------|
| Width | 1200px |
| Height | 630px |
| Format | SVG (or PNG) |
| Ratio | 1.91:1 (Facebook recommended) |
| File size | ~10KB (SVG), ~50-100KB (PNG) |
| Colors | Orange-red (#FF4500) brand |
| Logo | Official VD logo included |
| Background | Dark gradient matching app |

---

## 🚀 Deployment Checklist

- [x] OG image created với VD logo
- [x] Màu sắc updated to orange-red (#FF4500)
- [x] manifest.json theme_color updated
- [x] layout.tsx themeColor updated
- [x] seo.ts ogImage path updated
- [ ] Build app: `npm run build`
- [ ] Test Facebook Debugger
- [ ] Test Twitter Card Validator
- [ ] Test LinkedIn Post Inspector
- [ ] Deploy to production
- [ ] Clear Facebook cache (share link again)

---

## 📝 Notes

### SVG vs PNG:
- **SVG**: Vector, nhỏ gọn (~10KB), scale perfect
- **PNG**: Raster, lớn hơn (~50-100KB), wider compatibility

**Recommendation:** Dùng SVG, fallback PNG nếu có issues

### Facebook Cache:
Sau khi update OG image, Facebook cache có thể cũ.

**Fix:**
```
1. Vào Facebook Debugger
2. Nhập URL: https://vibedramas.com
3. Click "Scrape Again"
4. Share lại để test
```

### Mobile Preview:
OG image 1200x630 sẽ tự động resize cho mobile. Logo VD đủ lớn để nhìn rõ trên all devices.

---

**Made with 🧡 for Vibe Drama Branding**
