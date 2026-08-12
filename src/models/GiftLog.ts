import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftLog extends Document {
  claimId: string;
  userId: string;
  giftLevel: number;
  rank: number;
  coinsEarned: number;
  expEarned: number;
  leveledUp: boolean;
  ip: string;
  ua: string;
  verifiedSeconds: number;
  productUrl?: string;
  shopeeCoinsReward: number;
  shopeeCoinsEarned: number;
  shopeeClickedAt?: Date;
  createdAt: Date;
}

const GiftLogSchema: Schema = new Schema(
  {
    // sparse keeps the unique index compatible with historical log rows.
    claimId: { type: String, required: true, unique: true, sparse: true },
    userId: { type: String, required: true, index: true },
    giftLevel: { type: Number, required: true },
    rank: { type: Number, required: true },
    coinsEarned: { type: Number, required: true },
    expEarned: { type: Number, required: true },
    leveledUp: { type: Boolean, default: false },
    ip: { type: String, default: "unknown" },
    ua: { type: String, default: "unknown" },
    verifiedSeconds: { type: Number, required: true, min: 0 },
    productUrl: { type: String },
    shopeeCoinsReward: { type: Number, default: 0, min: 0 },
    shopeeCoinsEarned: { type: Number, default: 0, min: 0 },
    shopeeClickedAt: { type: Date },
  },
  { timestamps: true },
);

// Index for abuse detection: check rapid claims per user
GiftLogSchema.index({ userId: 1, createdAt: -1 });

const GiftLog: Model<IGiftLog> =
  mongoose.models.GiftLog || mongoose.model<IGiftLog>("GiftLog", GiftLogSchema);

export default GiftLog;
