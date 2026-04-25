# 🎯 SEO Improvements - Vibe Drama

## ✅ Đã cải thiện

### 1. **Metadata đầy đủ tiếng Việt**
- ✅ Title: "Vibe Drama - Xem Phim Ngắn, Phim Bộ Hay 2026"
- ✅ Description: 160 ký tự, từ khóa tiếng Việt
- ✅ Keywords: 13 keywords tiếng Việt + English
- ✅ Author, Publisher metadata
- ✅ Robots meta tags đầy đủ

### 2. **Open Graph (Facebook/Social)**
- ✅ og:title
- ✅ og:description
- ✅ og:image - `/icons/icon-512.png` (512x512)
- ✅ og:type - website
- ✅ og:url - Canonical URL
- ✅ og:site_name
- ✅ og:locale - vi_VN
- ✅ og:image dimensions (1200x630 trong metadata)

### 3. **Twitter Card**
- ✅ twitter:card - summary_large_image
- ✅ twitter:title
- ✅ twitter:description
- ✅ twitter:image
- ✅ twitter:creator - @vibedramas
- ✅ twitter:site - @vibedramas

### 4. **Schema.org Structured Data (JSON-LD)**
- ✅ Organization Schema:
  - name, alternateName, url
  - **logo** (512x512 PNG) - **FIX: Google sẽ hiện logo**
  - sameAs (social links)
  - contactPoint
  
- ✅ WebSite Schema:
  - name, url
  - potentialAction (SearchAction)
  - Sitelinks searchbox support

- ✅ BreadcrumbList helper function (có thể dùng cho từng page)

### 5. **Google Search Console**
- ✅ Verification meta tag support
- ✅ robots.txt đầy đủ
- ✅ sitemap.xml dynamic

### 6. **PWA Manifest**
- ✅ Updated với description tiếng Việt
- ✅ Icons đầy đủ (192, 512, SVG)
- ✅ Screenshots, shortcuts

---

## 📊 Keywords tiếng Việt

```typescript
keywords: [
  "phim ngắn",
  "phim bộ",
  "phim Trung Quốc",
  "phim Hàn Quốc",
  "phim Thái Lan",
  "xem phim online",
  "phim hay 2026",
  "short drama",
  "drama series",
  "xem phim miễn phí",
  "phim HD",
  "vibe drama",
  "vibedramas",
]
```

---

## 🔍 Google Search Features Enabled

### 1. **Logo trong Google Search** ✅
```json
{
  "@type": "Organization",
  "logo": {
    "@type": "ImageObject",
    "url": "https://vibedramas.com/icons/icon-512.png",
    "width": 512,
    "height": 512
  }
}
```

### 2. **Sitelinks Searchbox** ✅
```json
{
  "@type": "WebSite",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://vibedramas.com/search?q={search_term_string}"
  }
}
```

### 3. **Rich Snippets Ready** ✅
- Title + Description
- Image preview (OG image)
- Star ratings (khi có reviews)
- Breadcrumbs (khi dùng helper)

---

## 📝 Sử dụng trong code

### Layout.tsx (Root)
```tsx
import {
  generateOrganizationSchema,
  generateWebSiteSchema
} from "@/lib/seo";

// Trong component:
const orgSchema = generateOrganizationSchema();
const webSchema = generateWebSiteSchema();

// Trong <head>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(orgSchema),
  }}
/>
```

### Page metadata
```tsx
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Trang Cụ Thể - Vibe Drama",
    description: "Mô tả trang...",
    keywords: ["từ khóa 1", "từ khóa 2"],
    canonicalUrl: "/trang-cu-the",
    ogImage: "/custom-og-image.jpg",
  });
}
```

### Breadcrumbs
```tsx
import { generateBreadcrumbSchema } from "@/lib/seo";

const breadcrumbs = generateBreadcrumbSchema([
  { name: "Trang chủ", url: "/" },
  { name: "Phim bộ", url: "/all" },
  { name: "Tên phim", url: "/short/phim-slug" },
]);

// Thêm vào <head>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(breadcrumbs),
  }}
/>
```

---

## 🎨 OG Image

### Current:
- **Temporary:** `/icons/icon-512.png` (512x512)
- **Recommended:** Tạo `/icons/og-image.png` (1200x630)

### Tạo OG Image đẹp:
1. Design 1200x630px
2. Thêm:
   - Logo Vibe Drama
   - Text: "Xem Phim Ngắn, Phim Bộ Hay 2026"
   - Gradient background (Dark #000000 → #1A0A06 → #0D0D0D)
   - Accent: Orange-red (#FF4500)
   - Domain: vibedramas.com

3. Save to `/public/icons/og-image.png`

4. Update `seo.ts`:
```typescript
ogImage: "/icons/og-image.png"
```

### Generate từ SVG (đã có):
```bash
# Sử dụng tool convert SVG → PNG
# Hoặc Figma/Photoshop export 1200x630
```

---

## 🚀 Testing SEO

### 1. Google Rich Results Test
```
https://search.google.com/test/rich-results
```
Nhập URL: `https://vibedramas.com`

**Expected:**
- ✅ Organization schema valid
- ✅ WebSite schema valid
- ✅ Logo detected

### 2. Facebook Debugger
```
https://developers.facebook.com/tools/debug/
```
Nhập URL: `https://vibedramas.com`

**Expected:**
- ✅ og:image preview
- ✅ og:title, og:description
- ✅ No warnings

### 3. Twitter Card Validator
```
https://cards-dev.twitter.com/validator
```
Nhập URL: `https://vibedramas.com`

**Expected:**
- ✅ summary_large_image card
- ✅ Image preview
- ✅ Title + Description

### 4. Schema Markup Validator
```
https://validator.schema.org/
```
Paste JSON-LD từ view-source

**Expected:**
- ✅ 0 errors
- ✅ Organization + WebSite schemas valid

---

## 📈 Google Search Console Setup

### 1. Verify ownership
```html
<!-- Thêm vào .env -->
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_code_here
```

### 2. Submit sitemap
```
https://search.google.com/search-console/
→ Sitemaps
→ Add: https://vibedramas.com/sitemap.xml
```

### 3. Request indexing
```
→ URL Inspection
→ Test any URL
→ Request Indexing
```

---

## ✅ Checklist Deploy

- [ ] Build app: `npm run build`
- [ ] Verify metadata trong production
- [ ] Test Google Rich Results
- [ ] Test Facebook OG tags
- [ ] Test Twitter Cards
- [ ] Submit sitemap to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Monitor indexing status (7-14 days)

---

## 🎯 Kết quả mong đợi

### Google Search:
```
[LOGO] Vibe Drama
vibedramas.com

Vibe Drama - Xem Phim Ngắn, Phim Bộ Hay 2026
Xem phim ngắn, phim bộ Trung Quốc, Hàn Quốc, Thái Lan HOT nhất 2026...

[Sitelinks Searchbox]
```

### Social Share:
```
┌─────────────────────────────────┐
│  [OG IMAGE 1200x630]            │
│                                 │
│  Vibe Drama - Xem Phim Ngắn... │
│  Xem phim ngắn, phim bộ...      │
│  vibedramas.com                 │
└─────────────────────────────────┘
```

---

## 📞 Support

Nếu cần help với SEO:
- Google Search Console: [search.google.com/search-console](https://search.google.com/search-console)
- Google Analytics: [analytics.google.com](https://analytics.google.com)
- Schema.org Docs: [schema.org](https://schema.org)

---

**Made with ❤️ for Vibe Drama SEO**
