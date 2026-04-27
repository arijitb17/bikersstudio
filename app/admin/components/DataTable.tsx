"use client"
import { useState, useEffect, useRef } from 'react';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TableColumn } from '../types';

// Minimum characters before search fires (0 = search on every change, including clear)
const SEARCH_MIN_CHARS = 3;

interface DataTableProps<T extends { id: string; name?: string; title?: string; code?: string }> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string, name: string) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  pageSize?: number;
  // Optional — pass these to enable server-side pagination + search.
  // If omitted, the table paginates/filters the `data` array client-side.
  total?: number;
  page?: number;
}

export function DataTable<T extends { id: string; name?: string; title?: string; code?: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
  pageSize = 10,
  total: totalProp,
  page: pageProp,
}: DataTableProps<T>) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const isServerMode = totalProp !== undefined && pageProp !== undefined;

  // ── Local input value (instant — what user sees while typing) ──────────────
  const urlSearch = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(urlSearch);

  // Keep local input in sync when the URL search param changes externally
  // (e.g. browser back/forward, or parent component navigating)
  useEffect(() => {
    setInputValue(searchParams.get('search') || '');
  }, [searchParams]);

  // ── Client-side state (used when total/page props are NOT provided) ──────
  const [clientPage,   setClientPage]   = useState(1);
  const [clientSearch, setClientSearch] = useState('');

  // ── Character-based search trigger ──────────────────────────────────────
  // Fires search when:
  //   (a) user has typed ≥ SEARCH_MIN_CHARS characters, OR
  //   (b) input is completely empty (allow clearing the search)
  const prevSearchRef = useRef<string>(urlSearch);

  const triggerSearch = (value: string) => {
    if (isServerMode) {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // reset to first page on new search
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      setClientSearch(value);
      setClientPage(1);
    }
    prevSearchRef.current = value;
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    const isEnoughChars  = value.length >= SEARCH_MIN_CHARS;
    const isCleared      = value.length === 0;
    // Also fire if user is reducing characters back below threshold
    // so we don't leave a stale search result on screen
    const wasPreviouslySearching = prevSearchRef.current.length >= SEARCH_MIN_CHARS;
    const droppedBelowThreshold  = !isEnoughChars && wasPreviouslySearching;

    if (isEnoughChars || isCleared || droppedBelowThreshold) {
      triggerSearch(value);
    }
  };

  const handleClear = () => {
    setInputValue('');
    triggerSearch('');
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const filteredData = isServerMode
    ? data  // server already filtered
    : data.filter(item =>
        clientSearch === '' ||
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(clientSearch.toLowerCase())
        )
      );

  const total      = isServerMode ? totalProp      : filteredData.length;
  const page       = isServerMode ? pageProp       : clientPage;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const pagedData = isServerMode
    ? filteredData                                           // API already sliced
    : filteredData.slice(startIndex, startIndex + pageSize); // client slice

  // ── Page navigation ──────────────────────────────────────────────────────
  const goToPage = (p: number) => {
    if (isServerMode) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(p));
      router.push(`${pathname}?${params.toString()}`);
    } else {
      setClientPage(p);
    }
  };

  // ── Hint text below input ────────────────────────────────────────────────
  const showHint =
    inputValue.length > 0 && inputValue.length < SEARCH_MIN_CHARS;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Search… (min ${SEARCH_MIN_CHARS} characters)`}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {showHint && (
          <p className="mt-1 text-xs text-gray-400 pl-1">
            Type {SEARCH_MIN_CHARS - inputValue.length} more character{SEARCH_MIN_CHARS - inputValue.length !== 1 ? 's' : ''} to search…
          </p>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
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
                      {col.render ? col.render(value, item) : String(value ?? '')}
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
                          aria-label="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {showDelete && onDelete && (
                        <button
                          onClick={() => onDelete(item.id, item.name || item.title || item.code || 'Item')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          aria-label="Delete"
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

        {pagedData.length === 0 && (
          <div className="text-center py-12 text-gray-500">No data found</div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {total > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-gray-600">
          <span>
            Showing {total === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {getPaginationRange(safePage, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p as number)}
                  className={`min-w-[32px] h-8 rounded text-sm font-medium ${
                    safePage === p
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
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

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | '...')[] = [1];
  if (current > 3) range.push('...');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);
  if (current < total - 2) range.push('...');
  range.push(total);
  return range;
}