import DepositManager from "@/components/admin/DepositManager";

export const dynamic = "force-dynamic";

export default function DepositsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <DepositManager />
    </div>
  );
}
