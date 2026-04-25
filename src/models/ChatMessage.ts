import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  senderAvatar: string;
  content: string;
  imageUrl?: string;
  type: "text" | "image";
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    senderAvatar: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String },
    type: { type: String, enum: ["text", "image"], default: "text" },
  },
  { timestamps: true },
);

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
