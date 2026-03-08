import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "siswa" | "presensi" | "pembayaran" | "ujian";

const statusConfig: Record<StatusType, Record<string, { label: string; className: string }>> = {
  siswa: {
    aktif: { label: "Aktif", className: "bg-success/15 text-success border-success/30" },
    alumni: { label: "Alumni", className: "bg-info/15 text-info border-info/30" },
    pindah: { label: "Pindah", className: "bg-warning/15 text-warning border-warning/30" },
    keluar: { label: "Keluar", className: "bg-destructive/15 text-destructive border-destructive/30" },
  },
  presensi: {
    H: { label: "Hadir", className: "bg-success/15 text-success border-success/30" },
    S: { label: "Sakit", className: "bg-warning/15 text-warning border-warning/30" },
    I: { label: "Izin", className: "bg-info/15 text-info border-info/30" },
    A: { label: "Alpha", className: "bg-destructive/15 text-destructive border-destructive/30" },
  },
  pembayaran: {
    lunas: { label: "Lunas", className: "bg-success/15 text-success border-success/30" },
    sebagian: { label: "Sebagian", className: "bg-warning/15 text-warning border-warning/30" },
    belum: { label: "Belum Bayar", className: "bg-destructive/15 text-destructive border-destructive/30" },
    tunggak: { label: "Tunggakan", className: "bg-destructive/20 text-destructive border-destructive/40 font-semibold" },
  },
  ujian: {
    aktif: { label: "Aktif", className: "bg-success/15 text-success border-success/30" },
    selesai: { label: "Selesai", className: "bg-muted text-muted-foreground border-muted-foreground/30" },
    draft: { label: "Draft", className: "bg-warning/15 text-warning border-warning/30" },
  },
};

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const config = statusConfig[type]?.[status];
  if (!config) {
    return <Badge variant="outline" className={className}>{status}</Badge>;
  }
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
