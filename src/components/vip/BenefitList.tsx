import {
  Clock3,
  Coins,
  Crown,
  Gift,
  TimerReset,
  WalletCards,
} from "lucide-react";
import BenefitItem from "@/components/vip/BenefitItem";
import type { VipPackage } from "@/hooks/useVipPackages";

interface BenefitListProps {
  selectedPlan?: VipPackage | null;
}

export default function BenefitList({ selectedPlan }: BenefitListProps) {
  const benefits = [
    {
      icon: Coins,
      title:
        (selectedPlan?.coinsPerMinute ?? 1) > 1
          ? `+${selectedPlan?.coinsPerMinute ?? 1} xu mỗi phút xem`
          : "Bật kiếm tiền khi xem video",
      description:
        "Không có gói bậc sẽ không tích xu khi xem. Gói bậc là điều kiện để bật cơ chế kiếm tiền.",
    },
    {
      icon: Gift,
      title: `Áp dụng bậc hộp quà ${selectedPlan?.giftRank ?? 1}`,
      description:
        "Nếu cấp hiện tại thấp hơn, hệ thống sẽ nâng tối thiểu tới bậc hộp quà của gói khi mua.",
    },
    {
      icon: TimerReset,
      title: `${selectedPlan?.days ?? 0} ngày sử dụng`,
      description:
        "Mua xong áp dụng ngay và tính lại thời hạn từ lúc mua, không cộng dồn gói cũ.",
    },
    {
      icon: WalletCards,
      title: "Thanh toán bằng xu trong ví",
      description:
        "Không có tự động gia hạn, toàn bộ thông số lấy từ cấu hình admin.",
    },
    {
      icon: Clock3,
      title: "Xu mỗi hộp phụ thuộc cấp độ",
      description:
        "Xu/EXP khi mở hộp phụ thuộc cấp độ hộp quà hiện tại, không cố định theo tên gói.",
    },
    {
      icon: Crown,
      title: "Đúng cấu hình gói đang chọn",
      description:
        "Tên gói, badge, giá xu, xu/phút, bậc hộp quà và thời hạn đều đồng bộ với admin.",
    },
  ] as const;

  return (
    <div className="px-4 py-5 space-y-4">
      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
        Quyền lợi gói bậc
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {benefits.map((b) => (
          <BenefitItem
            key={b.title}
            icon={b.icon}
            title={b.title}
            description={b.description}
          />
        ))}
      </div>
    </div>
  );
}
