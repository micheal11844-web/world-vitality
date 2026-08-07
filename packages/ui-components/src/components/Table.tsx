import type { ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Right-align numeric columns — a small but real readability detail
   *  for data-dense views (Section 13's Research/Insurance case). */
  align?: "left" | "right";
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Denser padding for data-heavy professional views — opt-in, never
   *  default (Section 13). */
  compact?: boolean;
  caption?: string;
}

/** A plain, accessible `<table>` (ticket 5.2) — real `<th scope="col">`
 *  headers, not styled `<div>`s, so screen readers announce row/column
 *  relationships correctly. */
export function Table<T>({ columns, rows, getRowKey, compact = false, caption }: TableProps<T>) {
  const cellPadding = compact ? "0.375rem 0.5rem" : "0.75rem 1rem";

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--wv-font-sans)" }}>
      {caption && (
        <caption
          style={{ textAlign: "left", color: "var(--wv-text-secondary)", padding: cellPadding }}
        >
          {caption}
        </caption>
      )}
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              style={{
                textAlign: col.align ?? "left",
                padding: cellPadding,
                borderBottom: "2px solid var(--wv-border)",
                color: "var(--wv-text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)}>
            {columns.map((col) => (
              <td
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  padding: cellPadding,
                  borderBottom: "1px solid var(--wv-border)",
                  color: "var(--wv-text-primary)",
                }}
              >
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
