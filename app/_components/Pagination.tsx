"use client";

interface PaginationProps {
  total: number;
  perPage: number;
  page: number;
  onPage: (p: number) => void;
  label?: string;
}

export default function Pagination({ total, perPage, page, onPage, label }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const windowStart = Math.floor((page - 1) / 10) * 10 + 1;
  const windowEnd = Math.min(totalPages, windowStart + 9);
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-200">
      {label && <p className="text-sm text-gray-500">{label} ({total})</p>}
      {!label && <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} items)</p>}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
        >
          <span aria-hidden="true">←</span> Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-9.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
              p === page ? "bg-orange-500 text-white" : "text-gray-700 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}