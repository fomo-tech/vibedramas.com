import ReferralConfig, {
  DEFAULT_REFERRAL_CONFIG,
  type IReferralMilestone,
} from "@/models/ReferralConfig";

function normalizeMilestone(
  milestone: IReferralMilestone,
  index: number,
): IReferralMilestone {
  return {
    min: Math.max(0, Number(milestone.min ?? 0)),
    name: String(milestone.name || `Cấp ${index + 1}`).trim(),
    reward: Math.max(0, Number(milestone.reward ?? 0)),
    bonus: Math.max(0, Number(milestone.bonus ?? 0)),
  };
}

export function sanitizeReferralConfig(config: any) {
  const milestones = Array.isArray(config?.milestones)
    ? config.milestones
        .map((m: any, i: number) => normalizeMilestone(m, i))
        .sort((a: IReferralMilestone, b: IReferralMilestone) => b.min - a.min) // descending order
    : DEFAULT_REFERRAL_CONFIG.milestones;

  return {
    milestones,
    rewardPerReferral: Math.max(
      0,
      Number(
        config?.rewardPerReferral ?? DEFAULT_REFERRAL_CONFIG.rewardPerReferral,
      ),
    ),
    enableSystem: config?.enableSystem !== false,
  };
}

export async function ensureReferralConfig() {
  const existing = await ReferralConfig.findOne().lean();
  if (existing) {
    return sanitizeReferralConfig(existing);
  }

  const created = await ReferralConfig.create(DEFAULT_REFERRAL_CONFIG);
  return sanitizeReferralConfig(created.toObject());
}
