import mongoose, { Document, Model, Schema } from "mongoose";

export type WelfareClaimAction =
  | "daily_checkin"
  | "login"
  | "notifications"
  | "watch_ad"
  | "follow_facebook"
  | "custom";

export interface IWelfareClaim extends Document {
  userId: string;
  taskId: string;
  actionType: WelfareClaimAction;
  reward: number;
  dayKey: string;
  streakDay?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const WelfareClaimSchema = new Schema<IWelfareClaim>(
  {
    userId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, index: true },
    actionType: {
      type: String,
      enum: [
        "daily_checkin",
        "login",
        "notifications",
        "watch_ad",
        "follow_facebook",
        "custom",
      ],
      required: true,
      index: true,
    },
    reward: { type: Number, required: true, min: 0 },
    dayKey: { type: String, required: true, index: true },
    streakDay: { type: Number, min: 1 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

WelfareClaimSchema.index({ userId: 1, createdAt: -1 });
WelfareClaimSchema.index(
  { userId: 1, dayKey: 1, actionType: 1 },
  {
    unique: true,
    partialFilterExpression: { actionType: "daily_checkin" },
  },
);

const WelfareClaim: Model<IWelfareClaim> =
  mongoose.models.WelfareClaim ||
  mongoose.model<IWelfareClaim>("WelfareClaim", WelfareClaimSchema);

export default WelfareClaim;
