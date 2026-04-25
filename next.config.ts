import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network access for mobile testing
  allowedDevOrigins: ["192.168.1.67"],

  // Enable gzip/brotli compression for all responses
  compress: true,

  // Security & performance HTTP headers applied to every route
  async headers() {
    return [
      // ✅ HTML pages: không cache → luôn lấy mới nhất sau deploy
      {
        source: "/((?!_next/static|_next/image|icons|manifest.json|sw.js).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // ✅ Next.js static assets: cache vĩnh viễn (filename đã có hash)
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ✅ sw.js: không cache để browser luôn lấy SW mới nhất
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Block MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limit referrer information sent to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable FLoC / interest-based advertising
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS — force HTTPS for 1 year (only effective in production over HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Basic XSS protection header (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Content Security Policy — fully open (allow all) per request
          {
            key: "Content-Security-Policy",
            value: [
              "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
              "script-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
              "style-src * data: blob: 'unsafe-inline'",
              "img-src * data: blob:",
              "media-src * data: blob:",
              "font-src * data: blob:",
              "connect-src *",
              "frame-src *",
              "worker-src * blob:",
              "frame-ancestors *",
            ].join("; "),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
