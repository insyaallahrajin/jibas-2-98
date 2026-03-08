import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileUploadProps {
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  value?: string;
  onChange: (url: string | null) => void;
  className?: string;
}

export function FileUpload({
  bucket, path = "", accept = "image/*",
  maxSize = 5, value, onChange, className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setProgress(30);

    const ext = file.name.split(".").pop();
    const fileName = `${path}${Date.now()}.${ext}`;

    setProgress(60);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error("Gagal mengupload file: " + error.message);
      setUploading(false);
      setProgress(0);
      return;
    }

    setProgress(90);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    
    setPreview(urlData.publicUrl);
    onChange(urlData.publicUrl);
    setProgress(100);
    setUploading(false);
    toast.success("File berhasil diupload");
  }, [bucket, path, maxSize, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="h-32 w-32 rounded-lg object-cover border" />
          <Button
            type="button" variant="destructive" size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = accept;
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleUpload(file);
            };
            input.click();
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Upload className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? "Mengupload..." : "Klik atau seret file ke sini"}
            </p>
            <p className="text-xs text-muted-foreground">Maks {maxSize}MB</p>
          </div>
        </div>
      )}
      {uploading && <Progress value={progress} className="h-1" />}
    </div>
  );
}
