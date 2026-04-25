# PWA Installation Guide

## Tổng quan

VibeDrama app có hỗ trợ cài đặt PWA (Progressive Web App) trên cả iOS và Android với giao diện hướng dẫn đẹp mắt theo Vibe tone style.

## Component: PWAInstallPrompt

### Đặc điểm

- **Auto-detect Platform**: Tự động nhận diện iOS vs Android/Desktop
- **Smart Timing**: Hiển thị popup sau 3 giây khi trang load
- **Dismissal Memory**: Nhớ khi user bỏ qua, không hiện lại trong 7 ngày
- **Vibe Design**: Gradient vibe-pink, animations mượt mà với Framer Motion
- **iOS Guide**: Hướng dẫn chi tiết 3 bước với ảnh minh họa cho iOS

### Tính năng

#### 1. Main Install Prompt
- Hiển thị với backdrop blur và gradient card
- Features list: Truy cập nhanh, Toàn màn hình, Offline mode
- Call-to-action button gradient vibe-pink
- "Để sau" button để dismiss

#### 2. iOS Installation Guide
- Bottom sheet với 3 bước chi tiết
- Mỗi bước có:
  - Icon màu Vibe tone
  - Tiêu đề và mô tả rõ ràng
  - Ảnh minh họa (placeholder hiện tại)
  - Visual hints (icons, arrows)
- Swipe-to-close gesture support

#### 3. Android/Desktop PWA
- Sử dụng native `beforeinstallprompt` event
- One-click installation thông qua browser API

## Cấu trúc code

### State Management
```typescript
const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
const [showPrompt, setShowPrompt] = useState(false);
const [isIOS, setIsIOS] = useState(false);
const [isStandalone, setIsStandalone] = useState(false);
const [showIOSGuide, setShowIOSGuide] = useState(false);
const [currentStep, setCurrentStep] = useState(1);
```

### Platform Detection
```typescript
// iOS detection
const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

// Standalone check
const standalone = window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone ||
  document.referrer.includes("android-app://");
```

### Dismissal Logic
```typescript
// Check last dismiss time
const dismissed = localStorage.getItem("pwa-install-dismissed");
const dismissedTime = dismissed ? parseInt(dismissed) : 0;
const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

// Show if > 7 days since last dismiss
if (!standalone && daysSinceDismissed > 7) {
  setTimeout(() => setShowPrompt(true), 3000);
}
```

## iOS Installation Steps

### Step 1: Nhấn nút Chia sẻ
- Icon: Share (iOS share icon)
- Mô tả: Tìm và nhấn vào biểu tượng Chia sẻ ở thanh công cụ phía dưới
- Visual: Share icon trong blue border với arrow animation

### Step 2: Cuộn xuống tìm 'Thêm vào Màn hình Chính'
- Icon: Plus
- Mô tả: Trong menu chia sẻ, cuộn xuống và tìm tùy chọn này
- Visual: "Thêm vào Màn hình Chính" option với Plus icon

### Step 3: Nhấn 'Thêm'
- Icon: CheckCircle
- Mô tả: Xác nhận bằng cách nhấn nút Thêm ở góc trên bên phải
- Visual: Blue "Thêm" button

## Styling

### Colors
- Primary: Vibe Pink (#FF2A6D)
- Secondary: Orange (#F97316), Rose (#F43F5E)
- Background: Gray-900, Black with gradients
- Borders: Pink/Blue with opacity

### Animations (Framer Motion)
```typescript
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Main card
initial={{ opacity: 0, scale: 0.9, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.85, y: 30 }}
transition={{ type: "spring", damping: 25, stiffness: 300 }}

// iOS guide
initial={{ opacity: 0, y: 50 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 30 }}
```

### Layout
- Main prompt: Fixed centered modal (max-w-sm)
- iOS guide: Bottom sheet (max-h-85vh)
- Z-index: 9997 (backdrop), 9998 (content)

## Integration

### Root Layout
```tsx
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthInitializer />
          <PWAInstaller />
          <PWAInstallPrompt /> {/* ← Added here */}
          <NotificationProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Manifest Configuration

Ensure your `/public/manifest.json` có:
```json
{
  "name": "Vibe Drama",
  "short_name": "VibeDrama",
  "description": "Ứng dụng xem phim ngắn",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#FF2A6D",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## iOS Meta Tags

Trong `app/layout.tsx`:
```tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    manifest: "/manifest.json",
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: "cover",
    },
    themeColor: "#FF2A6D",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Vibe Drama",
    },
    applicationName: "Vibe Drama",
    icons: {
      apple: [
        {
          url: "/icons/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}
```

## Customization

### Thay đổi thời gian hiển thị
```typescript
// Hiện sau 5 giây thay vì 3
setTimeout(() => setShowPrompt(true), 5000);
```

### Thay đổi thời gian dismiss
```typescript
// Hiện lại sau 3 ngày thay vì 7
if (!standalone && daysSinceDismissed > 3) {
  setShowPrompt(true);
}
```

### Thêm ảnh thật cho iOS guide
```typescript
const iosSteps = [
  {
    step: 1,
    title: "Bước 1: Nhấn nút Chia sẻ",
    description: "Tìm và nhấn vào biểu tượng Chia sẻ ở thanh công cụ phía dưới",
    icon: Share,
    image: "/pwa-guide/ios-step1.png", // ← Thay bằng ảnh thật
  },
  // ...
];
```

Sau đó update component để hiển thị ảnh:
```tsx
{step.image && (
  <Image
    src={step.image}
    alt={step.title}
    width={400}
    height={160}
    className="w-full h-40 object-cover"
  />
)}
```

## Testing

### Test trên iOS
1. Mở Safari trên iPhone/iPad
2. Truy cập website
3. Đợi 3 giây → Install prompt xuất hiện
4. Nhấn "Cài đặt ngay" → iOS guide hiện ra
5. Follow các bước để thêm vào home screen

### Test trên Android/Desktop
1. Mở Chrome/Edge
2. Truy cập website  
3. Đợi 3 giây → Install prompt xuất hiện
4. Nhấn "Cài đặt ngay" → Native PWA install dialog
5. Confirm để cài đặt

### Test dismiss logic
1. Nhấn "Để sau"
2. Check localStorage: `pwa-install-dismissed` có timestamp
3. Reload page → Prompt không hiện
4. Clear localStorage → Prompt hiện lại

## Troubleshooting

### Prompt không hiện
- Check console logs
- Verify not already installed (standalone mode)
- Check localStorage for recent dismissal
- Ensure manifest.json configured correctly

### iOS guide không hoạt động
- Verify platform detection: `isIOS` state
- Check `showIOSGuide` state
- Ensure backdrop click handler working

### Android install không trigger
- Check `beforeinstallprompt` event listener
- Verify HTTPS connection (required for PWA)
- Check manifest.json có đầy đủ icons
- Ensure service worker registered

## Best Practices

1. **User Experience**
   - Không spam user → 7 ngày cooldown
   - Hiện sau 3 giây → không phá UX ban đầu
   - Easy dismiss → "Để sau" button rõ ràng

2. **Performance**
   - Lazy animations với Framer Motion
   - Lightweight component (<500 lines)
   - No heavy dependencies

3. **Accessibility**
   - Clear visual hierarchy
   - Large touch targets (min 44x44px)
   - Color contrast ratio đạt WCAG AA

4. **Mobile-first**
   - Responsive design
   - Touch-friendly buttons
   - Backdrop dismiss gesture

## Future Enhancements

- [ ] A/B test timing (3s vs 5s vs scroll depth)
- [ ] Add actual iOS screenshots
- [ ] Animated step transitions
- [ ] Platform-specific benefits copy
- [ ] Analytics tracking (install rate, dismiss rate)
- [ ] Multi-language support
- [ ] Video tutorial option
- [ ] Push notification permission flow

## References

- [PWA Install Prompt Best Practices](https://web.dev/customize-install/)
- [iOS Web Clips](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [beforeinstallprompt Event](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
