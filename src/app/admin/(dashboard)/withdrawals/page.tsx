import WithdrawalManager from "@/components/admin/WithdrawalManager";

export const dynamic = "force-dynamic";

export default function WithdrawalsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <WithdrawalManager />
    </div>
  );
}
