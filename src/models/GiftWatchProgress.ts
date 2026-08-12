import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGiftWatchProgress extends Document {
  userId: string;
  clientId: string;
  episodeId: string;
  verifiedSeconds: number;
  requiredSeconds: number;
  lastHeartbeatAt: Date;
  lastClientPosition: number;
  lastSequence: number;
  claimVersion: number;
  lastClaimAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GiftWatchProgressSchema = new Schema<IGiftWatchProgress>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true },
    episodeId: { type: String, required: true },
    verifiedSeconds: { type: Number, default: 0, min: 0 },
    requiredSeconds: { type: Number, required: true, min: 1 },
    lastHeartbeatAt: { type: Date, required: true },
    lastClientPosition: { type: Number, default: 0, min: 0 },
    lastSequence: { type: Number, default: 0, min: 0 },
    claimVersion: { type: Number, default: 0, min: 0 },
    lastClaimAt: { type: Date },
  },
  { timestamps: true },
);

GiftWatchProgressSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

const GiftWatchProgress: Model<IGiftWatchProgress> =
  mongoose.models.GiftWatchProgress ||
  mongoose.model<IGiftWatchProgress>(
    "GiftWatchProgress",
    GiftWatchProgressSchema,
  );

export default GiftWatchProgress;
