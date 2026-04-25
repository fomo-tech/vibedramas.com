import DramaTable from '@/components/admin/DramaTable';
import SyncButton from '@/components/admin/SyncButton';

export const dynamic = 'force-dynamic';

export default async function AdminDramasPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-4xl font-extrabold text-white tracking-tight">Dramas Catalog</h1>
           <p className="text-gray-400 mt-2 font-medium">Search the entire library, edit metadata or remove titles.</p>
        </div>
        <div className="flex space-x-3">
            <SyncButton />
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl transition-all font-bold text-sm uppercase tracking-widest shadow-lg shadow-red-500/20">
                Add New
            </button>
        </div>
      </div>

      <DramaTable />
    </div>
  );
}
