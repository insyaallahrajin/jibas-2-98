import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
  keuangan: "Staff Keuangan",
  siswa: "Siswa",
  pustakawan: "Pustakawan",
  kasir: "Kasir",
};

export function TopNavbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex-1">
        <h2 className="text-sm font-semibold text-foreground">SMA Negeri 1 Contoh</h2>
        <p className="text-[11px] text-muted-foreground leading-tight">Tahun Ajaran 2025/2026</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 border-b mb-1">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{role ? roleLabels[role] : "—"}</p>
            </div>
            <DropdownMenuItem>Profil Saya</DropdownMenuItem>
            <DropdownMenuItem>Ubah Password</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
