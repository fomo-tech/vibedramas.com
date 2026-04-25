import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVipLog extends Document {
  userId: string;
  packageId: string;
  packageName: string;
  days: number;
  coinsPaid: number;
  coinsPerMinute: number;
  giftRank: number;
  vipFrom: Date;
  vipTo: Date;
  createdAt: Date;
}

const VipLogSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    packageId: { type: String, required: true },
    packageName: { type: String, required: true },
    days: { type: Number, required: true },
    coinsPaid: { type: Number, required: true },
    coinsPerMinute: { type: Number, required: true, default: 1 },
    giftRank: { type: Number, required: true, default: 1 },
    vipFrom: { type: Date, required: true },
    vipTo: { type: Date, required: true },
  },
  { timestamps: true },
);

const VipLog: Model<IVipLog> =
  mongoose.models.VipLog || mongoose.model<IVipLog>("VipLog", VipLogSchema);

export default VipLog;
