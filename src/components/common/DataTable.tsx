import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterComponent?: React.ReactNode;
  actionButton?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onExportCsv?: () => void;
  rowsPerPage?: number;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filterComponent,
  actionButton,
  title,
  subtitle,
  onExportCsv,
  rowsPerPage = 10,
  emptyMessage = 'No matching records found.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search.trim() || !searchFilter) return data;
    return data.filter(item => searchFilter(item, search.trim().toLowerCase()));
  }, [data, search, searchFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {(title || actionButton || searchFilter || onExportCsv) && (
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {searchFilter && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors w-48 sm:w-64"
                />
              </div>
            )}

            {filterComponent}

            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            )}

            {actionButton}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-2.5 text-slate-800 ${
                        col.align === 'right'
                          ? 'text-right tabular-nums font-mono'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800 tabular-nums">
            {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-800 tabular-nums">
            {Math.min(currentPage * rowsPerPage, filteredData.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-800 tabular-nums">
            {filteredData.length}
          </span>{' '}
          records
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="tabular-nums font-medium text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
