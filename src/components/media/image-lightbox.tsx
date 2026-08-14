"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Download, Loader2, Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP_PX = 30;
const DRAG_SLOP_PX = 4;

function filenameFromUrl(url: string) {
  try {
    const { pathname } = new URL(url);
    return pathname.split("/").pop() || "image";
  } catch {
    return "image";
  }
}

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

// Full-size viewer for any image shared in the app — opened by passing a
// URL (or null to close). Fetches the image as a blob for both actions so
// Download works cross-origin (the `download` attribute alone is ignored
// by browsers for cross-origin links) and Share can attach the actual
// file where the platform supports it, falling back to sharing the link.
//
// Zoom is hand-rolled on top of the Pointer Events API rather than a
// library: pinch (two active pointers → scale by distance ratio), pan
// (one pointer while zoomed), double-tap/double-click to toggle zoom, and
// wheel/trackpad for desktop. A "moved" flag distinguishes a real drag
// from a tap so panning never accidentally triggers the backdrop's
// tap-to-close, and tapping the backdrop only closes when not zoomed in
// (otherwise a stray tap while panning would dismiss the viewer).
export function ImageLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  const [working, setWorking] = useState<"download" | "share" | null>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  // Reset zoom whenever a different image is shown — a render-time state
  // adjustment (React's documented alternative to an effect here) rather
  // than an effect, since resetting inside an effect would cause an extra
  // cascading render.
  const [resetForUrl, setResetForUrl] = useState(url);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    pinchStartDistance: 0,
    pinchStartScale: 1,
    panStart: { x: 0, y: 0 },
    transformStart: { x: 0, y: 0 },
    moved: false,
    lastTapAt: 0,
    lastTapPos: { x: 0, y: 0 },
  });
  // A single tap closes the viewer, but only after waiting to see whether
  // a second tap follows within the double-tap window — otherwise the
  // first tap of every double-tap-to-zoom would close the dialog before
  // the second tap ever arrives.
  const pendingClose = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelPendingClose() {
    if (pendingClose.current) {
      clearTimeout(pendingClose.current);
      pendingClose.current = null;
    }
  }

  if (url !== resetForUrl) {
    setResetForUrl(url);
    setTransform({ scale: 1, x: 0, y: 0 });
  }

  // Belt-and-suspenders cleanup: cancel any pending deferred-close timer
  // when the image changes or the component unmounts, so it can never
  // fire against a viewer that's already showing something else.
  useEffect(() => cancelPendingClose, [url]);

  function toggleZoom() {
    setTransform((t) => (t.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: DOUBLE_TAP_SCALE, x: 0, y: 0 }));
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved = false;
    setIsInteracting(true);

    if (pointers.current.size === 1) {
      gesture.current.panStart = { x: e.clientX, y: e.clientY };
      gesture.current.transformStart = { x: transform.x, y: transform.y };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinchStartDistance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      gesture.current.pinchStartScale = transform.scale;
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const scale = clampScale(gesture.current.pinchStartScale * (distance / gesture.current.pinchStartDistance));
      gesture.current.moved = true;
      setTransform((t) => ({ ...t, scale }));
    } else if (pointers.current.size === 1 && transform.scale > 1) {
      const dx = e.clientX - gesture.current.panStart.x;
      const dy = e.clientY - gesture.current.panStart.y;
      if (Math.abs(dx) > DRAG_SLOP_PX || Math.abs(dy) > DRAG_SLOP_PX) gesture.current.moved = true;
      setTransform((t) => ({ ...t, x: gesture.current.transformStart.x + dx, y: gesture.current.transformStart.y + dy }));
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    setIsInteracting(false);

    if (transform.scale < MIN_SCALE + 0.01) setTransform({ scale: 1, x: 0, y: 0 });

    if (gesture.current.moved) return;

    const now = Date.now();
    const dx = e.clientX - gesture.current.lastTapPos.x;
    const dy = e.clientY - gesture.current.lastTapPos.y;
    const isDoubleTap = now - gesture.current.lastTapAt < DOUBLE_TAP_MS && Math.hypot(dx, dy) < DOUBLE_TAP_SLOP_PX;

    if (isDoubleTap) {
      gesture.current.lastTapAt = 0;
      cancelPendingClose();
      toggleZoom();
    } else {
      gesture.current.lastTapAt = now;
      gesture.current.lastTapPos = { x: e.clientX, y: e.clientY };
      if (transform.scale === 1) {
        cancelPendingClose();
        pendingClose.current = setTimeout(() => onClose(), DOUBLE_TAP_MS);
      }
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setTransform((t) => {
      const scale = clampScale(t.scale - e.deltaY * 0.0025);
      return scale === 1 ? { scale: 1, x: 0, y: 0 } : { ...t, scale };
    });
  }

  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] w-[95vw] max-w-4xl flex-col gap-0 bg-transparent p-0 ring-0 sm:max-w-4xl"
      >
        {url && (
          <>
            <div
              className="relative min-h-0 flex-1 touch-none overflow-hidden select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onWheel={handleWheel}
            >
              <div
                className={cn("relative h-full w-full", !isInteracting && "transition-transform duration-150")}
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
              >
                <Image src={url} alt="" fill sizes="95vw" className="object-contain" draggable={false} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 py-3">
              <Button variant="secondary" size="sm" onClick={handleDownload} disabled={working !== null}>
                {working === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download
              </Button>
              <Button variant="secondary" size="sm" onClick={handleShare} disabled={working !== null}>
                {working === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  async function handleDownload() {
    if (!url) return;
    setWorking("download");
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filenameFromUrl(url);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Couldn't download the image — try again");
    } finally {
      setWorking(null);
    }
  }

  async function handleShare() {
    if (!url) return;
    setWorking("share");
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filenameFromUrl(url), { type: blob.type || "image/jpeg" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") toast.error("Couldn't share the image — try again");
    } finally {
      setWorking(null);
    }
  }
}
