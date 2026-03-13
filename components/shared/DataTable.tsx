import * as React from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

function DataTable({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <p className="text-[13px] text-zinc-600">{emptyMessage}</p>
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
                className="px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-600"
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
              className={`transition-colors duration-200 ${
                onRowClick ? "cursor-pointer" : ""
              } hover:bg-zinc-50`}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${
                    colIndex === 0 ? "text-zinc-800" : "text-zinc-500"
                  }`}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] ?? "\u2014")}
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
