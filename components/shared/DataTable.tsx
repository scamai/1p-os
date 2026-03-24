import * as React from "react";

interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <p className="text-[13px] text-black/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-2 sm:px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-black/60 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); } } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              className={`transition-colors duration-150 ${
                onRowClick ? "cursor-pointer focus-visible:outline-none focus-visible:bg-black/[0.04]" : ""
              } hover:bg-black/[0.02]`}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={col.key}
                  className={`px-2 sm:px-4 py-2 sm:py-3 ${
                    colIndex === 0 ? "text-black/80" : "text-black/50"
                  }`}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : (String(row[col.key] ?? "\u2014"))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
