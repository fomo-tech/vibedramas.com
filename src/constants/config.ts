export const AppConfig = {
  name: "Vibe Drama",
  description: "Ứng Dụng Xem Phim Ngắn Hàng Đầu Việt Nam",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://vibedramas.com",
  social: {
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
  apiPrefix: "/api",
};

export const COIN_RATE: Record<string, number> = {
  vip_basic: 1, // xu/phút
  vip_pro: 2,
  vip_premium: 3,
  vip: 2, // fallback cho vipStatus = true không có plan cụ thể
};

export const Routes = {
  HOME: "/",
  EXPLORE: "/explore",
  DRAMA_DETAIL: (id: string) => `/drama/${id}`,
  PROFILE: "/profile",
  LOGIN: "/login",
};
