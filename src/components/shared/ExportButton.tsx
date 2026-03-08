import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  columns?: { key: string; label: string }[];
}

function exportCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string) {
  const headers = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      const str = val == null ? "" : String(val);
      return str.includes(",") ? `"${str}"` : str;
    }).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ data, filename = "export", columns }: ExportButtonProps) {
  const cols = columns || (data.length > 0
    ? Object.keys(data[0]).map((k) => ({ key: k, label: k }))
    : []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportCSV(data, cols, filename)}>
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}>
          Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
