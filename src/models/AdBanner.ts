import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdBanner extends Document {
  imageUrl: string;
  linkUrl: string;
  altText?: string;
  showAfterSeconds: number;
  rehideAfterSeconds: number;
  isActive: boolean;
  showToVip: boolean; // nếu true: VIP cũng thấy quảng cáo
  createdAt: Date;
  updatedAt: Date;
}

const AdBannerSchema: Schema = new Schema(
  {
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, required: true },
    altText: { type: String, default: "Quảng cáo" },
    showAfterSeconds: { type: Number, default: 30 },
    rehideAfterSeconds: { type: Number, default: 60 },
    isActive: { type: Boolean, default: true },
    showToVip: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const AdBanner: Model<IAdBanner> =
  mongoose.models.AdBanner ||
  mongoose.model<IAdBanner>("AdBanner", AdBannerSchema);

export default AdBanner;
