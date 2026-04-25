import { LucideIcon } from "lucide-react";

interface BenefitItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function BenefitItem({
  icon: Icon,
  title,
  description,
}: BenefitItemProps) {
  return (
    <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/6">
      {/* Icon bubble */}
      <div className="w-8 h-8 rounded-xl bg-vibe-pink/15 border border-vibe-pink/20 flex items-center justify-center">
        <Icon size={16} className="text-vibe-pink" />
      </div>
      <div>
        <p className="text-white font-bold text-sm leading-snug">{title}</p>
        <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
