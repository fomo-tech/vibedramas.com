import mongoose, { Schema, Document, Model } from "mongoose";

export type TopupMethod = "momo" | "bank";
export type TopupStatus = "pending" | "completed" | "failed" | "expired";

export interface ITopupOrder extends Document {
  userId: string;
  orderId: string; // unique e.g. VIBE_1714567890_a3f8
  method: TopupMethod;
  amount: number; // VND
  coins: number; // xu to be credited on success
  packageId: string;
  packageLabel: string;
  status: TopupStatus;

  // MoMo specific
  momoRequestId?: string;
  momoDeeplink?: string;
  momoQrCode?: string;
  momoTransId?: string;
  momoPayUrl?: string;

  // Bank specific – transfer content = orderId
  bankTransferContent: string;

  paidAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TopupOrderSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    method: { type: String, enum: ["momo", "bank"], required: true },
    amount: { type: Number, required: true },
    coins: { type: Number, required: true },
    packageId: { type: String, required: true },
    packageLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "expired"],
      default: "pending",
      index: true,
    },
    momoRequestId: String,
    momoDeeplink: String,
    momoQrCode: String,
    momoTransId: String,
    momoPayUrl: String,
    bankTransferContent: { type: String, required: true },
    paidAt: Date,
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

const TopupOrder: Model<ITopupOrder> =
  mongoose.models.TopupOrder ||
  mongoose.model<ITopupOrder>("TopupOrder", TopupOrderSchema);

export default TopupOrder;
