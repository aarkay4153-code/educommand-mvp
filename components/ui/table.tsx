import { cn } from "@/lib/utils";

export function DataTable({
  headers,
  emptyMessage = "No records available yet.",
  rows,
}: {
  emptyMessage?: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="print-table overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-card">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className={cn("px-4 py-4", cellIndex === 0 && "font-medium text-foreground")}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="bg-card">
              <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
