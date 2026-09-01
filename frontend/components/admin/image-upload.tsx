"use client";

import { useRef, useState } from "react";
import { GripVertical, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  order: number;
}

async function uploadOne(file: File, folder: string): Promise<UploadedImage> {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  const signJson = await signRes.json();
  if (!signJson.ok) throw new Error(signJson.error?.message ?? "Upload not available");
  const { signature, timestamp, apiKey, cloudName } = signJson.data;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadJson.error?.message ?? "Upload failed");

  return {
    publicId: uploadJson.public_id,
    url: uploadJson.secure_url,
    width: uploadJson.width,
    height: uploadJson.height,
    alt: "",
    order: 0,
  };
}

export function ImageUpload({
  value,
  onChange,
  folder = "opportunities",
  max = 20,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (value.length + files.length > max) {
      toast.error(`Maximum ${max} images`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map((f) => uploadOne(f, folder)));
      const next = [...value, ...uploaded].map((img, i) => ({ ...img, order: i }));
      onChange(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    const next = value.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i }));
    onChange(next);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next.map((img, i) => ({ ...img, order: i })));
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((img, i) => (
          <div
            key={img.publicId}
            draggable
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex.current !== null) reorder(dragIndex.current, i);
              dragIndex.current = null;
            }}
            className="group relative aspect-square cursor-move overflow-hidden rounded-lg border border-border"
          >
            <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="size-4 text-white" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="rounded-full bg-black/50 p-1 text-white hover:bg-danger"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-brass-500 px-1.5 py-0.5 text-[10px] font-semibold text-obsidian-900">
                Cover
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || value.length >= max}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            (uploading || value.length >= max) && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          <span className="text-xs">{uploading ? "Uploading" : "Add"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
