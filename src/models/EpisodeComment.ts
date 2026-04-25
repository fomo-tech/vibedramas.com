import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEpisodeComment extends Document {
  episodeId: string;
  dramaId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeCommentSchema = new Schema<IEpisodeComment>(
  {
    episodeId: { type: String, required: true, index: true },
    dramaId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    content: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

EpisodeCommentSchema.index({ episodeId: 1, createdAt: -1 });

const EpisodeComment: Model<IEpisodeComment> =
  mongoose.models.EpisodeComment ||
  mongoose.model<IEpisodeComment>("EpisodeComment", EpisodeCommentSchema);

export default EpisodeComment;
