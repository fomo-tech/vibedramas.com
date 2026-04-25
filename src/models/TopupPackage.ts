import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITopupPackage extends Document {
  label: string;
  amount: number; // VNĐ
  coins: number; // xu credited (can differ from amount for bonuses)
  bonus: number; // bonus percentage label (display only)
  hot?: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopupPackageSchema: Schema = new Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 1000 },
    coins: { type: Number, required: true, min: 1 },
    bonus: { type: Number, default: 0 },
    hot: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

TopupPackageSchema.index({ isActive: 1, order: 1 });

const TopupPackage: Model<ITopupPackage> =
  mongoose.models.TopupPackage ||
  mongoose.model<ITopupPackage>("TopupPackage", TopupPackageSchema);

export default TopupPackage;

export const DEFAULT_TOPUP_PACKAGES = [
  { label: "10K", amount: 10000, coins: 10000, bonus: 0, order: 1 },
  { label: "20K", amount: 20000, coins: 20000, bonus: 0, order: 2 },
  { label: "50K", amount: 50000, coins: 50000, bonus: 0, hot: true, order: 3 },
  { label: "100K", amount: 100000, coins: 100000, bonus: 0, hot: true, order: 4 },
  { label: "200K", amount: 200000, coins: 200000, bonus: 0, order: 5 },
  { label: "500K", amount: 500000, coins: 500000, bonus: 0, order: 6 },
];
