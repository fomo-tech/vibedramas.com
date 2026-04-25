import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthInitializer from "@/components/shared/AuthInitializer";
import PWAInstaller from "@/components/PWAInstaller";
import { PWAProvider } from "@/components/PWAInstallPrompt";
import NotificationProvider from "@/components/ui/NotificationProvider";
import {
  getSeoConfig,
  buildMetadata,
  DEFAULT_SEO,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/seo";
import SplashScreen from "@/components/home/SplashScreen";
import PWAUpdateBanner from "@/components/PWAUpdateBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FF4500",
};

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await getSeoConfig("home");
  const metadata = buildMetadata(seoConfig || DEFAULT_SEO);

  return {
    ...metadata,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Vibe Drama",
    },
    applicationName: "Vibe Drama",
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        {
          url: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          url: "/icons/app-logo.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
      shortcut: ["/icons/icon-192.png"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate JSON-LD structured data for SEO
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <html
      lang="vi"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* JSON-LD Structured Data for Google Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {/* Google Analytics (chỉ chạy ở production) */}
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID &&
          process.env.NODE_ENV === "production" && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
              ></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
                `,
                }}
              />
            </>
          )}
      </head>
      <body
        className="min-h-full flex bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <PWAProvider>
            <AuthInitializer />
            <PWAInstaller />
            <NotificationProvider />
            <PWAUpdateBanner />
            {/* Main Content Area - Layout controlled by pages/components */}
            <SplashScreen />
            <div className="flex-1 flex flex-col relative min-h-screen max-w-full overflow-x-hidden">
              {children}
            </div>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
