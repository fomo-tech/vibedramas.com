import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReferralMilestone {
  min: number;
  name: string;
  reward: number;
  bonus: number;
}

export interface IReferralConfig extends Document {
  milestones: IReferralMilestone[];
  rewardPerReferral: number;
  enableSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralMilestoneSchema = new Schema<IReferralMilestone>(
  {
    min: { type: Number, required: true, min: 0 },
    name: { type: String, required: true },
    reward: { type: Number, required: true, min: 0 },
    bonus: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ReferralConfigSchema = new Schema<IReferralConfig>(
  {
    milestones: {
      type: [ReferralMilestoneSchema],
      default: [
        { min: 1, name: "Người mới", reward: 50, bonus: 0 },
        { min: 5, name: "Nhập môn", reward: 50, bonus: 100 },
        { min: 10, name: "Tiến bộ", reward: 60, bonus: 200 },
        { min: 20, name: "Chuyên nghiệp", reward: 70, bonus: 500 },
        { min: 50, name: "Cao thủ", reward: 80, bonus: 1000 },
        { min: 100, name: "Đại sứ", reward: 100, bonus: 3000 },
      ],
    },
    rewardPerReferral: {
      type: Number,
      default: 50,
      min: 0,
    },
    enableSystem: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const ReferralConfig: Model<IReferralConfig> =
  mongoose.models.ReferralConfig ||
  mongoose.model<IReferralConfig>("ReferralConfig", ReferralConfigSchema);

export default ReferralConfig;

export const DEFAULT_REFERRAL_CONFIG: Omit<
  IReferralConfig,
  keyof Document | "createdAt" | "updatedAt"
> = {
  milestones: [
    { min: 1, name: "Người mới", reward: 50, bonus: 0 },
    { min: 5, name: "Nhập môn", reward: 50, bonus: 100 },
    { min: 10, name: "Tiến bộ", reward: 60, bonus: 200 },
    { min: 20, name: "Chuyên nghiệp", reward: 70, bonus: 500 },
    { min: 50, name: "Cao thủ", reward: 80, bonus: 1000 },
    { min: 100, name: "Đại sứ", reward: 100, bonus: 3000 },
  ],
  rewardPerReferral: 50,
  enableSystem: true,
};
