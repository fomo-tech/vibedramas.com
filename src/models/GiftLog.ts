import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftLog extends Document {
  userId: string;
  giftLevel: number;
  rank: number;
  coinsEarned: number;
  expEarned: number;
  leveledUp: boolean;
  ip: string;
  ua: string;
  createdAt: Date;
}

const GiftLogSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    giftLevel: { type: Number, required: true },
    rank: { type: Number, required: true },
    coinsEarned: { type: Number, required: true },
    expEarned: { type: Number, required: true },
    leveledUp: { type: Boolean, default: false },
    ip: { type: String, default: "unknown" },
    ua: { type: String, default: "unknown" },
  },
  { timestamps: true },
);

// Index for abuse detection: check rapid claims per user
GiftLogSchema.index({ userId: 1, createdAt: -1 });

const GiftLog: Model<IGiftLog> =
  mongoose.models.GiftLog || mongoose.model<IGiftLog>("GiftLog", GiftLogSchema);

export default GiftLog;
