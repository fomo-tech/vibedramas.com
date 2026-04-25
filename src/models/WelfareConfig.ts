import mongoose, { Document, Model, Schema } from "mongoose";
import { AppConfig } from "@/constants/config";

export type WelfareTaskIcon =
  | "login"
  | "notifications"
  | "watch_ad"
  | "facebook";

export type WelfareTaskAction =
  | "login"
  | "notifications"
  | "watch_ad"
  | "follow_facebook"
  | "custom";

export interface IWelfareTask {
  id: string;
  title: string;
  subtitle: string;
  reward: number;
  actionLabel: string;
  icon: WelfareTaskIcon;
  actionType: WelfareTaskAction;
  enabled: boolean;
  dailyLimit: number;
  totalLimit: number;
  requiresImageProof: boolean;
  linkUrl?: string;
  order: number;
}

export interface IWelfareConfig extends Document {
  headerTitle: string;
  headerSubtitle: string;
  rewardsTabLabel: string;
  memberTabLabel: string;
  dailyCheckInRewards: number[];
  tasks: IWelfareTask[];
  createdAt: Date;
  updatedAt: Date;
}

const WelfareTaskSchema = new Schema<IWelfareTask>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    reward: { type: Number, required: true, min: 0 },
    actionLabel: { type: String, required: true },
    icon: {
      type: String,
      enum: ["login", "notifications", "watch_ad", "facebook"],
      required: true,
    },
    actionType: {
      type: String,
      enum: ["login", "notifications", "watch_ad", "follow_facebook", "custom"],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    dailyLimit: { type: Number, default: 0, min: 0 },
    totalLimit: { type: Number, default: 0, min: 0 },
    requiresImageProof: { type: Boolean, default: false },
    linkUrl: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const WelfareConfigSchema = new Schema<IWelfareConfig>(
  {
    headerTitle: {
      type: String,
      default: "Trung tâm phúc lợi",
    },
    headerSubtitle: {
      type: String,
      default: "Điểm danh mỗi ngày và làm nhiệm vụ để nhận thêm xu.",
    },
    rewardsTabLabel: {
      type: String,
      default: "Xu thưởng",
    },
    memberTabLabel: {
      type: String,
      default: "Điểm hội viên",
    },
    dailyCheckInRewards: {
      type: [Number],
      default: [10, 20, 20, 10, 10, 25, 40],
    },
    tasks: {
      type: [WelfareTaskSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const WelfareConfig: Model<IWelfareConfig> =
  mongoose.models.WelfareConfig ||
  mongoose.model<IWelfareConfig>("WelfareConfig", WelfareConfigSchema);

export default WelfareConfig;

export const DEFAULT_WELFARE_CONFIG: Omit<
  IWelfareConfig,
  keyof Document | "createdAt" | "updatedAt"
> = {
  headerTitle: "Trung tâm phúc lợi",
  headerSubtitle: "Điểm danh mỗi ngày và làm nhiệm vụ để nhận thêm xu.",
  rewardsTabLabel: "Xu thưởng",
  memberTabLabel: "Điểm hội viên",
  dailyCheckInRewards: [10, 20, 20, 10, 10, 25, 40],
  tasks: [
    {
      id: "login",
      title: "Đăng nhập tài khoản",
      subtitle: "Nhận thưởng một lần sau khi hoàn tất đăng nhập.",
      reward: 60,
      actionLabel: "Đăng nhập",
      icon: "login",
      actionType: "login",
      enabled: true,
      dailyLimit: 0,
      totalLimit: 1,
      requiresImageProof: false,
      order: 1,
    },
    {
      id: "notifications",
      title: "Bật thông báo hệ thống",
      subtitle: "Cho phép trình duyệt gửi thông báo để không lỡ tập mới.",
      reward: 60,
      actionLabel: "Mở",
      icon: "notifications",
      actionType: "notifications",
      enabled: true,
      dailyLimit: 0,
      totalLimit: 1,
      requiresImageProof: false,
      order: 2,
    },
    {
      id: "watch_ad",
      title: "Làm nhiệm vụ kiếm video",
      subtitle: "Xem đầy đủ video để nhận xu ngay.",
      reward: 20,
      actionLabel: "Xem video",
      icon: "watch_ad",
      actionType: "watch_ad",
      enabled: true,
      dailyLimit: 15,
      totalLimit: 0,
      requiresImageProof: false,
      order: 3,
    },
    {
      id: "follow_facebook",
      title: "Theo dõi trên Facebook",
      subtitle: "Theo dõi fanpage để cập nhật lịch chiếu và ưu đãi mới.",
      reward: 20,
      actionLabel: "Theo dõi",
      icon: "facebook",
      actionType: "follow_facebook",
      enabled: true,
      dailyLimit: 0,
      totalLimit: 1,
      requiresImageProof: false,
      linkUrl: AppConfig.social.facebook,
      order: 4,
    },
  ],
};
