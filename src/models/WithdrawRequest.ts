import mongoose, { Schema, Document, Model } from "mongoose";

export type WithdrawStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected";

export interface IWithdrawRequest extends Document {
  userId: string;
  amount: number; // in xu
  /** Snapshot of the payment method at time of request */
  paymentMethodSnapshot: {
    type: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: WithdrawStatus;
  userNote?: string;
  adminNote?: string;
  processedBy?: string; // Admin ID xử lý
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawRequestSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethodSnapshot: {
      type: {
        type: String,
        enum: ["bank", "momo", "zalopay"],
        required: true,
      },
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    userNote: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    processedBy: { type: String }, // Admin ID
    processedAt: { type: Date },
  },
  { timestamps: true },
);

const WithdrawRequest: Model<IWithdrawRequest> =
  mongoose.models.WithdrawRequest ||
  mongoose.model<IWithdrawRequest>("WithdrawRequest", WithdrawRequestSchema);

export default WithdrawRequest;
