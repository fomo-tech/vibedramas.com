import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType =
  | "topup" // tier package purchase / coin recharge
  | "earn_watch" // coins earned watching (VIP per-minute)
  | "earn_gift_box" // coins from daily gift box
  | "earn_referral" // coins from referral bonus
  | "spend_unlock" // coins spent to unlock an episode
  | "coin_gift_sent" // coins sent to another user
  | "coin_gift_received" // coins received from another user
  | "bonus"; // promotional / admin bonus

export interface ITransaction extends Document {
  userId: string;
  type: TransactionType;
  amount: number; // always positive
  direction: "credit" | "debit";
  balanceAfter?: number;
  description: string;
  metadata: {
    packageName?: string;
    packagePrice?: number;
    episodeId?: string;
    episodeName?: string;
    dramaName?: string;
    toUserId?: string;
    fromUserId?: string;
    toUsername?: string;
    fromUsername?: string;
    note?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "topup",
        "earn_watch",
        "earn_gift_box",
        "earn_referral",
        "spend_unlock",
        "coin_gift_sent",
        "coin_gift_received",
        "bonus",
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    balanceAfter: { type: Number },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, direction: 1, createdAt: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
