import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferralLog extends Document {
  referrerId: string; // user đã giới thiệu
  refereeId: string; // user mới được giới thiệu
  coinsAwarded: number;
  bonusAwarded: number; // milestone bonus nếu có
  milestone?: string; // tên milestone đạt được
  createdAt: Date;
}

const ReferralLogSchema: Schema = new Schema(
  {
    referrerId: { type: String, required: true, index: true },
    refereeId: { type: String, required: true, unique: true }, // mỗi user chỉ được count 1 lần
    coinsAwarded: { type: Number, required: true },
    bonusAwarded: { type: Number, default: 0 },
    milestone: { type: String },
  },
  { timestamps: true },
);

const ReferralLog: Model<IReferralLog> =
  mongoose.models.ReferralLog ||
  mongoose.model<IReferralLog>("ReferralLog", ReferralLogSchema);

export default ReferralLog;
