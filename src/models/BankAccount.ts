import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankAccount extends Document {
  bankName: string; // Tên ngân hàng (VCB, ACB, MB...)
  accountNumber: string; // Số tài khoản
  accountName: string; // Tên chủ tài khoản
  bankBranch?: string; // Chi nhánh (optional)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema: Schema = new Schema(
  {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    bankBranch: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

BankAccountSchema.index({ isActive: 1 });

const BankAccount: Model<IBankAccount> =
  mongoose.models.BankAccount ||
  mongoose.model<IBankAccount>("BankAccount", BankAccountSchema);

export default BankAccount;
