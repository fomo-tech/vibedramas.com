import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoConfig extends Document {
  page: string; // 'home', 'drama-detail', 'vip', etc.
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeoConfigSchema: Schema = new Schema(
  {
    page: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    keywords: [{ type: String }],
    ogImage: { type: String },
    ogType: { type: String, default: "website" },
    twitterCard: { type: String, default: "summary_large_image" },
    canonicalUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const SeoConfig: Model<ISeoConfig> =
  mongoose.models.SeoConfig ||
  mongoose.model<ISeoConfig>("SeoConfig", SeoConfigSchema);

export default SeoConfig;
