import mongoose, { Schema, Document, Model } from "mongoose";

const MetaItemSchema = new Schema(
  {
    id: { type: String },
    name: { type: String },
    slug: { type: String },
  },
  { _id: false },
);

export interface IDrama extends Document {
  name: string;
  slug: string;
  origin_name: string;
  alternative_names: string[];
  content: string;
  type: string;
  status: string;
  thumb_url: string;
  poster_url: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: { id?: string; name: string; slug: string }[];
  country: { id?: string; name: string; slug: string }[];

  // Custom metadata for our project
  likes: number;
  isTrending: boolean;
  trendingRank?: number; // Thứ tự trending (null = không trending)
  createdAt: Date;
  updatedAt: Date;
}

const DramaSchema: Schema = new Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    origin_name: { type: String },
    alternative_names: [{ type: String }],
    content: { type: String },
    type: { type: String },
    status: { type: String, default: "ongoing" },
    thumb_url: { type: String },
    poster_url: { type: String },
    is_copyright: { type: Boolean, default: false },
    sub_docquyen: { type: Boolean, default: false },
    chieurap: { type: Boolean, default: false },
    trailer_url: { type: String },
    time: { type: String },
    episode_current: { type: String },
    episode_total: { type: String },
    quality: { type: String },
    lang: { type: String },
    year: { type: Number },
    view: { type: Number, default: 0 },
    actor: [{ type: String }],
    director: [{ type: String }],
    category: [MetaItemSchema],
    country: [MetaItemSchema],

    likes: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
    trendingRank: { type: Number, index: true, sparse: true }, // Sparse index for nullable field
  },
  {
    timestamps: true,
  },
);

DramaSchema.index({ "category.slug": 1 });
DramaSchema.index({ "country.slug": 1 });
DramaSchema.index({ isTrending: 1 });
DramaSchema.index({ year: -1 });

const Drama: Model<IDrama> =
  mongoose.models.Drama || mongoose.model<IDrama>("Drama", DramaSchema);

export default Drama;
