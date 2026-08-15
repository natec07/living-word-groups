"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { updateGroupCoverAction, updateSpaceCoverAction } from "@/server/actions/admin-content";
import { cn } from "@/lib/utils";
import { isSelectableImage } from "@/lib/image-file";

const MAX_BYTES = 8 * 1024 * 1024;

export function CoverImageUpload({
  id,
  type,
  currentUrl,
}: {
  id: string;
  type: "group" | "space";
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const action = type === "group" ? updateGroupCoverAction : updateSpaceCoverAction;

  const { startUpload, isUploading } = useUploadThing("coverImageUploader", {
    onClientUploadComplete: async ([file]) => {
      if (file) {
        await action(id, file.ufsUrl);
        toast.success("Cover image updated");
        router.refresh();
      }
    },
    onUploadError: (err) => {
      toast.error(err.message || "Couldn't upload cover image — try again");
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
      toast.error("Image must be under 8MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    startUpload([file]);
  }

  const shownUrl = preview ?? currentUrl;

  return (
    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
      {shownUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shownUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change cover image"
        className={cn(
          "absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-60"
        )}
      >
        <Camera className="h-3 w-3" aria-hidden="true" />
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
