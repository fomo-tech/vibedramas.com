import { Flame, Zap, Star, Sparkles, Crown } from "lucide-react";

export const RANK_COLORS: Record<number, [string, string]> = {
  1: ["#FF4500", "#FF6B2B"],
  2: ["#FF2D55", "#FF7A1A"],
  3: ["#FFB800", "#FF5A1F"],
  4: ["#FF375F", "#FF9F0A"],
  5: ["#FFE08A", "#FF4500"],
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
  2: "rgba(255,45,85,0.08)",
  3: "rgba(255,184,0,0.08)",
  4: "rgba(255,55,95,0.08)",
  5: "rgba(255,224,138,0.09)",
};

export const RANK_NAMES: Record<number, string> = {
  1: "Khán Giả",
  2: "Fan Cứng",
  3: "Sao Nổi",
  4: "Minh Tinh",
  5: "Huyền Thoại",
};
