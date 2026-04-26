"use client"
import  { useState } from 'react';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TableColumn } from '../types';

interface DataTableProps<T extends { id: string; name?: string; title?: string; code?: string }> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string, name: string) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  pageSize?: number;
}

export function DataTable<T extends { id: string; name?: string; title?: string; code?: string }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  showEdit = true, 
  showDelete = true,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 whenever search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-black"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {(showEdit || showDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagedData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map(col => {
                  const value = item[col.key];
                  return (
                    <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {col.render ? col.render(value, item) : String(value)}
                    </td>
                  );
                })}
                {(showEdit || showDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {showEdit && onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {showDelete && onDelete && (
                        <button
                          onClick={() => onDelete(item.id, item.name || item.title || item.code || 'Item')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center py-12 text-black">
            No data found
          </div>
        )}
      </div>

      {/* Pagination bar */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length}
          </span>

          <div className="flex items-center gap-1">
            {/* First */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {getPaginationRange(safePage, totalPages).map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 select-none">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`min-w-[32px] h-8 rounded text-sm font-medium
                    ${safePage === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                    }`}
                >
                  {page}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Returns a window of page numbers with ellipsis, e.g. [1, '...', 4, 5, 6, '...', 12] */
function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const range: (number | '...')[] = [1];

  if (current > 3) range.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);

  if (current < total - 2) range.push('...');

  range.push(total);
  return range;
}