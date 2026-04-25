import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoinLog extends Document {
  userId: string;
  amount: number;
  type: "watch" | "deposit" | "withdraw" | "bonus" | "referral" | "purchase";
  description?: string;
  // For watch-and-earn
  episodeId?: string;
  minuteIndex?: number;
  // For deposit/withdraw
  relatedId?: string;
  createdAt: Date;
}

const CoinLogSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ["watch", "deposit", "withdraw", "bonus", "referral", "purchase"],
      default: "watch",
    },
    description: { type: String },
    // For watch-and-earn
    episodeId: { type: String },
    minuteIndex: { type: Number },
    // For deposit/withdraw reference
    relatedId: { type: String },
  },
  { timestamps: true },
);

// Index for watch-and-earn (chặn double-credit cùng 1 phút)
// partialFilterExpression: chỉ áp dụng unique khi cả episodeId lẫn minuteIndex tồn tại
CoinLogSchema.index(
  { userId: 1, episodeId: 1, minuteIndex: 1 },
  {
    unique: true,
    partialFilterExpression: {
      episodeId: { $exists: true, $type: "string" },
      minuteIndex: { $exists: true, $type: "number" },
    },
  },
);

// Index for transaction history
CoinLogSchema.index({ userId: 1, type: 1, createdAt: -1 });

const CoinLog: Model<ICoinLog> =
  mongoose.models.CoinLog || mongoose.model<ICoinLog>("CoinLog", CoinLogSchema);

export default CoinLog;
