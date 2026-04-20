import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

const TARGET_KB = 200;
const MAX_DIMENSION = 1920;

const hasAlpha = (file: File) => file.type === "image/png";

export async function compressImage(file: File): Promise<File> {
  // Skip compression for tiny files or non-images
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= TARGET_KB * 1024) return file;
  if (file.type === "image/gif") return file; // preserve animation

  const fileType = hasAlpha(file) ? "image/png" : "image/jpeg";
  const compressed = await imageCompression(file, {
    maxSizeMB: TARGET_KB / 1024,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType,
    initialQuality: 0.8,
  });

  // Ensure we return a File (some envs return Blob)
  if (compressed instanceof File) return compressed;
  return new File([compressed], file.name, { type: fileType });
}

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressed, compressed.name);

  const { data, error } = await supabase.functions.invoke("r2-upload", {
    body: formData,
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Upload failed: no URL returned");
  return data.url as string;
}
