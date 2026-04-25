"use client";

import { useState, useEffect, useCallback } from "react";
import DramaRow from "./DramaRow";
import EditDramaModal from "./EditDramaModal";
import Pagination from "./Pagination";
import { Search, Loader2 } from "lucide-react";

export default function DramaTable() {
  const [dramas, setDramas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingDrama, setEditingDrama] = useState<any>(null);

  const fetchDramas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/dramas?page=${page}&search=${searchTerm}`,
      );
      const data = await res.json();
      if (data.dramas) {
        setDramas(data.dramas);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch dramas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      fetchDramas();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch on page change
  useEffect(() => {
    fetchDramas();
  }, [page]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <input
          type="text"
          placeholder="Search all dramas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-12 pr-4 py-3 text-white transition-colors outline-none text-sm placeholder:text-gray-600"
        />
      </div>

      {/* Table Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/50 border-b border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <th className="p-4">Poster</th>
                <th className="p-4">Drama Info</th>
                <th className="p-4">Status</th>
                <th className="p-4">Views</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-gray-800 transition-opacity duration-200 ${isLoading ? "opacity-40" : "opacity-100"}`}
            >
              {dramas.map((drama) => (
                <DramaRow
                  key={drama._id.toString()}
                  drama={drama}
                  onEdit={(d) => setEditingDrama(d)}
                />
              ))}
              {!isLoading && dramas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-gray-500 italic"
                  >
                    No dramas found matching your search in the entire database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Sidebar-style footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isPending={isLoading}
        />
      </div>

      {/* Edit Modal */}
      {editingDrama && (
        <EditDramaModal
          drama={editingDrama}
          onClose={() => {
            setEditingDrama(null);
            fetchDramas(); // Refresh after edit
          }}
        />
      )}
    </div>
  );
}
