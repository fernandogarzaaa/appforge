/**
 * AdminTable Component
 * Reusable data table with sorting, filtering, and pagination
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminTable({
  columns = [],
  data = [],
  onSort,
  onFilterChange,
  itemsPerPage = 20,
  renderRow,
  selectable = false,
  onSelectionChange,
  loading = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filters, setFilters] = useState({});

  // Handle sorting
  const handleSort = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
    onSort?.({ key: columnKey, direction });
  };

  // Handle filter changes
  const handleFilterChange = (columnKey, value) => {
    const newFilters = { ...filters, [columnKey]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    onFilterChange?.(newFilters);
  };

  // Handle row selection
  const handleRowSelect = (rowId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.([...newSelected]);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(paginatedData.map((item, idx) => idx));
      setSelectedRows(newSelected);
      onSelectionChange?.([...newSelected]);
    }
  };

  // Pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label="Data table">
          <thead>
            <tr className="bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <div
                    className={`flex items-center gap-2 ${
                      column.sortable ? 'cursor-pointer hover:text-purple-600' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                    role={column.sortable ? 'button' : undefined}
                    tabIndex={column.sortable ? 0 : -1}
                    onKeyDown={
                      column.sortable
                        ? (e) => e.key === 'Enter' && handleSort(column.key)
                        : undefined
                    }
                  >
                    {column.label}
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp
                          className={`w-3 h-3 -mb-1 ${
                            sortConfig.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-purple-600'
                              : 'text-gray-400'
                          }`}
                          aria-hidden="true"
                        />
                        <ChevronDown
                          className={`w-3 h-3 -mt-1 ${
                            sortConfig.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-purple-600'
                              : 'text-gray-400'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </div>
                  {column.filterable && (
                    <input
                      type="text"
                      placeholder={`Filter ${column.label}...`}
                      value={filters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="mt-2 w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      aria-label={`Filter by ${column.label}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full" />
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) =>
                renderRow ? (
                  renderRow(row, idx, {
                    isSelected: selectedRows.has(idx),
                    onSelect: () => handleRowSelect(idx),
                  })
                ) : (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {selectable && (
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(idx)}
                          onChange={() => handleRowSelect(idx)}
                          className="w-4 h-4 rounded"
                          aria-label={`Select row ${idx + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={`${idx}-${column.key}`}
                        className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage - 2 + i;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
