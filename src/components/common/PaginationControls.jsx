import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600">
        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={1 === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <Button
              variant={totalPages === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}