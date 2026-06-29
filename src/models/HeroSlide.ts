import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHeroSlide extends Document {
  dramaId: string;
  posterUrl?: string;
  order: number; // Thứ tự hiển thị
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema: Schema = new Schema(
  {
    dramaId: { type: String, required: true, ref: "Drama" },
    posterUrl: { type: String, default: "" },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

HeroSlideSchema.index({ order: 1 });
HeroSlideSchema.index({ isActive: 1 });

const HeroSlide: Model<IHeroSlide> =
  mongoose.models.HeroSlide ||
  mongoose.model<IHeroSlide>("HeroSlide", HeroSlideSchema);

export default HeroSlide;
