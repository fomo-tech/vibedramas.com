import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRankConfig extends Document {
  rank: number; // 1–5, fixed
  name: string; // "Tân Binh", "Chiến Binh", ...
  coinsReward: number; // coins awarded when opening gift box
  watchSeconds: number; // seconds of watching to fill gift bar (base, before VIP multiplier)
  price: number; // purchase price for this tier
  days: number; // membership duration in days
  coinsPerMinute: number; // watch earning rate while tier is active
  isActive: boolean;
  order: number;
  badge?: string;
  badgeVariant?: "popular" | "best";
  createdAt: Date;
  updatedAt: Date;
}

const RankConfigSchema: Schema = new Schema(
  {
    rank: { type: Number, required: true, unique: true, min: 1, max: 5 },
    name: { type: String, required: true },
    coinsReward: { type: Number, required: true, min: 1 },
    watchSeconds: { type: Number, required: true, min: 10 },
    price: { type: Number, required: true, min: 0, default: 0 },
    days: { type: Number, required: true, min: 1, default: 30 },
    coinsPerMinute: { type: Number, required: true, min: 0, default: 1 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    badge: { type: String },
    badgeVariant: { type: String, enum: ["popular", "best"] },
  },
  { timestamps: true },
);

RankConfigSchema.index({ rank: 1 });

const RankConfig: Model<IRankConfig> =
  mongoose.models.RankConfig ||
  mongoose.model<IRankConfig>("RankConfig", RankConfigSchema);

export default RankConfig;

/** Default 5 ranks. Called if collection is empty. */
export const DEFAULT_RANKS = [
  {
    rank: 1,
    name: "Khán Giả",
    coinsReward: 10,
    watchSeconds: 60,
    price: 0,
    days: 30,
    coinsPerMinute: 1,
    isActive: true,
    order: 1,
  },
  {
    rank: 2,
    name: "Fan Cứng",
    coinsReward: 20,
    watchSeconds: 55,
    price: 500,
    days: 30,
    coinsPerMinute: 1.2,
    isActive: true,
    order: 2,
    badge: "Phổ biến",
    badgeVariant: "popular",
  },
  {
    rank: 3,
    name: "Sao Nổi",
    coinsReward: 35,
    watchSeconds: 50,
    price: 1200,
    days: 30,
    coinsPerMinute: 1.6,
    isActive: true,
    order: 3,
  },
  {
    rank: 4,
    name: "Minh Tinh",
    coinsReward: 55,
    watchSeconds: 45,
    price: 2500,
    days: 30,
    coinsPerMinute: 2,
    isActive: true,
    order: 4,
  },
  {
    rank: 5,
    name: "Huyền Thoại",
    coinsReward: 80,
    watchSeconds: 40,
    price: 5000,
    days: 30,
    coinsPerMinute: 3,
    isActive: true,
    order: 5,
    badge: "Best",
    badgeVariant: "best",
  },
];
