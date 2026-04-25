import mongoose, { Schema, Document } from "mongoose";

export interface IChatRoom extends Document {
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageAt: Date;
  status: "open" | "closed";
  adminUnread: number;
  userUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    adminUnread: { type: Number, default: 0 },
    userUnread: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ChatRoom =
  mongoose.models.ChatRoom ||
  mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema);

export default ChatRoom;
