import { FileText, FileImage, FileArchive, File } from "lucide-react";
import { isImageExt, isPdfExt } from "@/lib/files";

interface FileIconProps {
  ext: string;
  size?: number;
  className?: string;
}

export function FileIcon({ ext, size = 18, className = "" }: FileIconProps) {
  if (isImageExt(ext)) return <FileImage size={size} className={className} />;
  if (isPdfExt(ext)) return <FileText size={size} className={className} />;
  if (["zip", "rar"].includes(ext)) return <FileArchive size={size} className={className} />;
  return <File size={size} className={className} />;
}
