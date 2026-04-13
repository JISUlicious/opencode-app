/** @jsxImportSource react */
import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
};

/** Recursively collect plain text from an mdast node tree. */
function extractText(node: MdastNode | undefined): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join("");
  }
  return "";
}

/** Parse mdast table node into headers + rows of strings. */
export function parseTableNode(
  node: MdastNode | undefined,
): { headers: string[]; rows: string[][] } | null {
  if (!node || node.type !== "table" || !Array.isArray(node.children)) return null;

  const [headerRow, ...bodyRows] = node.children;
  if (!headerRow || !Array.isArray(headerRow.children)) return null;

  const headers = headerRow.children.map(extractText);
  const rows = bodyRows.map((row) =>
    Array.isArray(row.children) ? row.children.map(extractText) : [],
  );

  return { headers, rows };
}

function toMarkdown(headers: string[], rows: string[][]): string {
  const escape = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const header = `| ${headers.map(escape).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(escape).join(" | ")} |`).join("\n");
  return `${header}\n${sep}\n${body}`;
}

function toDelimited(headers: string[], rows: string[][], delim: string): string {
  const escape = (s: string) => {
    if (s.includes(delim) || s.includes("\n") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = headers.map(escape).join(delim);
  const body = rows.map((r) => r.map(escape).join(delim)).join("\n");
  return `${header}\n${body}`;
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") {
    return (
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className="shrink-0">
        <path d="M8 3l4 5H4z" fill="currentColor" />
      </svg>
    );
  }
  if (dir === "desc") {
    return (
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className="shrink-0">
        <path d="M8 13l4-5H4z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className="shrink-0 opacity-40">
      <path d="M8 3l3 4H5zM8 13l3-4H5z" fill="currentColor" />
    </svg>
  );
}

export interface RichTableProps {
  headers: string[];
  rows: string[][];
}

export function RichTable({ headers, rows }: RichTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [copied, setCopied] = useState<null | "md" | "csv" | "tsv">(null);

  const data = useMemo(
    () =>
      rows.map((row) => {
        const record: Record<string, string> = {};
        row.forEach((cell, i) => {
          record[`c${i}`] = cell;
        });
        return record;
      }),
    [rows],
  );

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(
    () =>
      headers.map((h, i) => ({
        accessorKey: `c${i}`,
        header: h || `Column ${i + 1}`,
        sortingFn: (a, b, id) => {
          const av = a.getValue<string>(id) ?? "";
          const bv = b.getValue<string>(id) ?? "";
          const an = Number(av);
          const bn = Number(bv);
          if (!Number.isNaN(an) && !Number.isNaN(bn) && av.trim() !== "" && bv.trim() !== "") {
            return an - bn;
          }
          return av.localeCompare(bv);
        },
      })),
    [headers],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCopy = async (fmt: "md" | "csv" | "tsv") => {
    let text = "";
    if (fmt === "md") text = toMarkdown(headers, rows);
    else if (fmt === "csv") text = toDelimited(headers, rows, ",");
    else text = toDelimited(headers, rows, "\t");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(fmt);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-[18px] border border-dls-border/70 bg-gray-1/80">
      <div className="flex items-center justify-between gap-2 border-b border-dls-border/70 px-3 py-2">
        <div className="text-[11px] font-medium text-gray-10">
          {rows.length} row{rows.length === 1 ? "" : "s"} × {headers.length} col
          {headers.length === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-1">
          {(["md", "csv", "tsv"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => handleCopy(fmt)}
              className="rounded-full border border-dls-border bg-dls-surface px-2.5 py-1 text-[11px] font-medium text-dls-text transition-colors hover:bg-dls-hover"
            >
              {copied === fmt ? "Copied" : `Copy ${fmt.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-dls-hover/80 backdrop-blur">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="border-b border-dls-border/70 px-3 py-2 text-left font-semibold text-gray-12"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 text-left hover:text-dls-accent"
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          <SortIcon dir={sortDir} />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={
                  idx % 2 === 0 ? "bg-transparent" : "bg-gray-2/40"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-dls-border/40 px-3 py-2 align-top text-gray-12"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
