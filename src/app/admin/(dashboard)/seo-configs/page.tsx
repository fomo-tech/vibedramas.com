import SeoConfigManager from "@/components/admin/SeoConfigManager";

export const dynamic = "force-dynamic";

export default function SeoConfigsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <SeoConfigManager />
    </div>
  );
}
