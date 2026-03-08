import { ReactNode } from "react";

interface PrintLayoutProps {
  schoolName?: string;
  schoolAddress?: string;
  schoolLogo?: string;
  title: string;
  children: ReactNode;
  showSignature?: boolean;
  signatureTitle?: string;
  signatureName?: string;
}

export function PrintLayout({
  schoolName = "Nama Sekolah",
  schoolAddress = "Alamat Sekolah",
  schoolLogo,
  title,
  children,
  showSignature = true,
  signatureTitle = "Kepala Sekolah",
  signatureName = "________________________",
}: PrintLayoutProps) {
  return (
    <div className="print-only hidden bg-background text-foreground p-8 max-w-[210mm] mx-auto">
      {/* Kop Surat */}
      <div className="flex items-center gap-4 border-b-2 border-foreground pb-3 mb-6">
        {schoolLogo && <img src={schoolLogo} alt="Logo" className="h-16 w-16 object-contain" />}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold uppercase">{schoolName}</h1>
          <p className="text-sm">{schoolAddress}</p>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-center font-bold text-base mb-6 underline">{title}</h2>

      {/* Content */}
      <div className="min-h-[400px]">{children}</div>

      {/* Signature */}
      {showSignature && (
        <div className="mt-12 flex justify-end">
          <div className="text-center">
            <p className="mb-16">{signatureTitle},</p>
            <p className="font-bold underline">{signatureName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
