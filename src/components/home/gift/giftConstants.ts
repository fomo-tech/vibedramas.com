import { Flame, Zap, Star, Sparkles, Crown } from "lucide-react";

export const RANK_COLORS: Record<number, [string, string]> = {
  1: ["#FF4500", "#FF6B2B"],
  2: ["#FF8C00", "#FFA333"],
  3: ["#FFD700", "#FFB300"],
  4: ["#9B59B6", "#C04080"],
  5: ["#00D4FF", "#66E5FF"],
};

export const RANK_BADGES: Record<number, React.ElementType> = {
  1: Flame,
  2: Zap,
  3: Star,
  4: Sparkles,
  5: Crown,
};

export const RANK_BG: Record<number, string> = {
  1: "rgba(255,69,0,0.08)",
  2: "rgba(255,140,0,0.08)",
  3: "rgba(255,215,0,0.08)",
  4: "rgba(155,89,182,0.08)",
  5: "rgba(0,212,255,0.08)",
};

export const RANK_NAMES: Record<number, string> = {
  1: "Khán Giả",
  2: "Fan Cứng",
  3: "Sao Nổi",
  4: "Minh Tinh",
  5: "Huyền Thoại",
};
