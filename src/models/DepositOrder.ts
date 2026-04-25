import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepositOrder extends Document {
  userId: string;
  amount: number;
  orderCode: string; // Mã unique để check
  bankAccountId: string;
  qrCodeUrl?: string; // URL QR code
  status: "pending" | "completed" | "expired" | "cancelled";
  expiresAt: Date; // 15 phút từ lúc tạo
  completedAt?: Date;
  sepayTransactionId?: string; // ID từ Sepay khi verify
  createdAt: Date;
  updatedAt: Date;
}

const DepositOrderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 10000 }, // Tối thiểu 10k
    orderCode: { type: String, required: true, unique: true, index: true },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },
    qrCodeUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    sepayTransactionId: { type: String, index: true },
  },
  {
    timestamps: true,
  },
);

DepositOrderSchema.index({ userId: 1, createdAt: -1 });

const DepositOrder: Model<IDepositOrder> =
  mongoose.models.DepositOrder ||
  mongoose.model<IDepositOrder>("DepositOrder", DepositOrderSchema);

export default DepositOrder;
