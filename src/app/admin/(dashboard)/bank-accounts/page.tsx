import BankAccountManager from "@/components/admin/BankAccountManager";

export const dynamic = "force-dynamic";

export default function BankAccountsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <BankAccountManager />
    </div>
  );
}
