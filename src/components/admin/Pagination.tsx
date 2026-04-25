import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPending?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, isPending }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-t border-gray-800 sm:px-6 rounded-b-2xl">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isPending}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isPending}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Page <span className="font-bold text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="relative inline-flex items-center rounded-l-md border border-gray-800 bg-gray-950 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-900 focus:z-20 disabled:opacity-30 transition-colors"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            
            <button
              disabled
              className="relative inline-flex items-center border border-gray-800 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 z-10"
            >
              {currentPage}
            </button>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
              className="relative inline-flex items-center rounded-r-md border border-gray-800 bg-gray-950 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-900 focus:z-20 disabled:opacity-30 transition-colors"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
