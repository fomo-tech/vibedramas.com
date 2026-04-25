import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchHistory extends Document {
  userId: string;
  slug: string;
  dramaId: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode: string;
  watchedAt: Date;
}

const WatchHistorySchema: Schema = new Schema({
  userId: { type: String, required: true },
  slug: { type: String, required: true },
  dramaId: { type: String },
  name: { type: String },
  origin_name: { type: String },
  thumb_url: { type: String },
  poster_url: { type: String },
  episode: { type: String },
  watchedAt: { type: Date, default: Date.now },
});

// One entry per user per drama (upsert by userId+slug)
WatchHistorySchema.index({ userId: 1, slug: 1 }, { unique: true });
WatchHistorySchema.index({ userId: 1, watchedAt: -1 });

const WatchHistory: Model<IWatchHistory> =
  mongoose.models.WatchHistory ||
  mongoose.model<IWatchHistory>("WatchHistory", WatchHistorySchema);

export default WatchHistory;
