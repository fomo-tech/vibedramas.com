import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  googleId?: string;
  role: "user" | "admin";
  avatar?: string;
  coins: number;
  vipStatus: boolean;
  vipExpiry?: Date;
  vipCoinsPerMinute: number;
  vipPackageName: string;
  giftLevel: number;
  unlockedEpisodes: mongoose.Types.ObjectId[];
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  likedDramas: string[];
  likedEpisodes?: string[]; // Episode IDs
  bonusCoins: number;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String }, // Optional if using OAuth providers
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String },
    coins: { type: Number, default: 0 },
    vipStatus: { type: Boolean, default: false },
    vipExpiry: { type: Date },
    vipCoinsPerMinute: { type: Number, default: 0 },
    vipPackageName: { type: String, default: "" },
    giftLevel: { type: Number, default: 1 },
    unlockedEpisodes: [{ type: Schema.Types.ObjectId, ref: "Episode" }],
    googleId: { type: String, sparse: true, unique: true },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },
    referralCount: { type: Number, default: 0 },
    likedDramas: [{ type: String }],
    likedEpisodes: [{ type: String }],
    bonusCoins: { type: Number, default: 0 },
    lastLoginIp: { type: String },
    lastLoginUserAgent: { type: String },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Define the model specifically to prevent Next.js from recompiling and throwing overwrite errors
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
