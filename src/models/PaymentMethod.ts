import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentMethodType = "bank" | "momo";

export interface IPaymentMethod extends Document {
  userId: string;
  type: PaymentMethodType;
  /** Bank display name or wallet name, e.g. "Vietcombank" / "MoMo" */
  bankName: string;
  /** Short code used for transfer, e.g. "VCB" */
  bankCode?: string;
  /** Account number or phone number for e-wallets */
  accountNumber: string;
  /** Full name on the account */
  accountName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["bank", "momo"],
      required: true,
    },
    bankName: { type: String, required: true, trim: true },
    bankCode: { type: String, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Only one default per user
PaymentMethodSchema.index({ userId: 1, isDefault: 1 });

const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
