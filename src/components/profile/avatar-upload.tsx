"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUploadThing } from "@/lib/uploadthing";
import { initials } from "@/lib/format";
import { isSelectableImage } from "@/lib/image-file";

const MAX_BYTES = 4 * 1024 * 1024;

export function AvatarUpload({
  currentUrl,
  firstName,
  lastName,
}: {
  currentUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("avatarUploader", {
    onClientUploadComplete: () => {
      toast.success("Profile photo updated");
      router.refresh();
    },
    onUploadError: (err) => {
      toast.error(err.message || "Couldn't upload photo — try again");
      setPreview(null);
    },
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isSelectableImage(file)) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    startUpload([file]);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar className="h-20 w-20 border border-glass-surface-border">
          <AvatarImage src={preview ?? currentUrl ?? undefined} alt="" />
          <AvatarFallback className="text-lg">{initials(firstName, lastName)}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
            <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Change profile photo"
          className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground transition-transform duration-(--motion-fast) ease-(--motion-spring) active:scale-90 disabled:opacity-60"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Profile photo</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or GIF — up to 4MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
