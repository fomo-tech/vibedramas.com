import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEpisode extends Document {
  dramaId: mongoose.Types.ObjectId;
  server_name: string;
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
  likeCount?: number;
}

const EpisodeSchema: Schema = new Schema(
  {
    dramaId: {
      type: Schema.Types.ObjectId,
      ref: "Drama",
      required: true,
      index: true,
    },
    server_name: { type: String },
    name: { type: String, required: true },
    slug: { type: String },
    filename: { type: String },
    link_embed: { type: String },
    link_m3u8: { type: String },
    likeCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
);

// Ensure unique episode per drama based on its exact name (tập)
EpisodeSchema.index({ dramaId: 1, name: 1 }, { unique: true });

const Episode: Model<IEpisode> =
  mongoose.models.Episode || mongoose.model<IEpisode>("Episode", EpisodeSchema);

export default Episode;
