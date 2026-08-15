"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon, Loader2, Mic, Pause, Play, Send, Square, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";
import { sendMessageAction } from "@/server/actions/messaging";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 4;
const MAX_RECORDING_SECONDS = 300;

const AUDIO_MIME_CANDIDATES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return AUDIO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

type Recording = { blob: Blob; url: string; durationSeconds: number };

export function GroupChatComposer({
  conversationId,
  onSent,
  placeholder = "Message the group…",
}: {
  conversationId: string;
  onSent?: () => void;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [sending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  // Mirrors recordingSeconds so the recorder's onstop handler (created
  // once at record-start) reads the latest elapsed time instead of a
  // stale value closed over when recording began.
  const recordingSecondsRef = useRef(0);

  const { startUpload: startImageUpload, isUploading: isUploadingImages } = useUploadThing("chatImageUploader", {
    onClientUploadComplete: (results) => {
      setUploadedUrls((prev) => [...prev, ...results.map((r) => r.ufsUrl)]);
    },
    onUploadError: (err) => {
      toast.error(err.message || "Couldn't upload photo — try again");
    },
  });

  const { startUpload: startAudioUpload, isUploading: isUploadingAudio } = useUploadThing("chatAudioUploader", {
    onUploadError: (err) => {
      toast.error(err.message || "Couldn't send voice message — try again");
    },
  });

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (uploadedUrls.length + files.length > MAX_IMAGES) {
      toast.error(`Attach up to ${MAX_IMAGES} images at a time`);
      return;
    }
    const oversized = files.find((f) => f.size > MAX_BYTES);
    if (oversized) {
      toast.error("Images must be under 8MB");
      return;
    }
    startImageUpload(files);
  }

  function removeImage(url: string) {
    setUploadedUrls((prev) => prev.filter((u) => u !== url));
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType ?? "audio/webm" });
        setRecording((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { blob, url: URL.createObjectURL(blob), durationSeconds: recordingSecondsRef.current };
        });
        stopStream();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
        if (recordingSecondsRef.current >= MAX_RECORDING_SECONDS) stopRecording();
      }, 1000);
    } catch {
      toast.error("Couldn't access the microphone — check your permissions");
    }
  }

  function stopRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  }

  function discardRecording() {
    if (recording) URL.revokeObjectURL(recording.url);
    setRecording(null);
    setPreviewPlaying(false);
  }

  function cancelRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopStream();
  }

  function togglePreviewPlayback() {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
    } else {
      audio.play();
      setPreviewPlaying(true);
    }
  }

  function submit() {
    if (isUploadingImages || sending) return;
    if (!body.trim() && uploadedUrls.length === 0 && !recording) return;
    const text = body;
    const urls = uploadedUrls;
    const voiceRecording = recording;
    setBody("");
    setUploadedUrls([]);
    setRecording(null);
    startTransition(async () => {
      let voice: { url: string; durationSeconds: number } | undefined;
      if (voiceRecording) {
        const file = new File([voiceRecording.blob], "voice-message", { type: voiceRecording.blob.type });
        const results = await startAudioUpload([file]);
        const url = results?.[0]?.ufsUrl;
        if (!url) {
          toast.error("Couldn't send voice message — try again");
          return;
        }
        voice = { url, durationSeconds: voiceRecording.durationSeconds };
        URL.revokeObjectURL(voiceRecording.url);
      }
      await sendMessageAction(conversationId, text, urls, voice);
      onSent?.();
    });
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 border-t border-border p-3">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-destructive" />
        <span className="flex-1 text-sm text-muted-foreground">Recording… {formatTime(recordingSeconds)}</span>
        <Button type="button" variant="ghost" size="icon" onClick={cancelRecording} aria-label="Cancel recording">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" onClick={stopRecording} aria-label="Stop recording">
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 border-t border-border p-3">
        <audio ref={previewAudioRef} src={recording.url} onEnded={() => setPreviewPlaying(false)} className="hidden" />
        <Button type="button" variant="secondary" size="icon" onClick={togglePreviewPlayback} aria-label={previewPlaying ? "Pause" : "Play"}>
          {previewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
        </Button>
        <span className="flex-1 text-sm text-muted-foreground">Voice message · {formatTime(recording.durationSeconds)}</span>
        <Button type="button" variant="ghost" size="icon" onClick={discardRecording} aria-label="Discard recording">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" onClick={submit} disabled={sending || isUploadingAudio} aria-label="Send voice message">
          {sending || isUploadingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-border p-3"
    >
      {(uploadedUrls.length > 0 || isUploadingImages) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {uploadedUrls.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {isUploadingImages && (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploadingImages}
          aria-label="Attach photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={startRecording}
          aria-label="Record voice message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Mic className="h-5 w-5" />
        </button>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="min-h-10 flex-1 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || isUploadingImages || (!body.trim() && uploadedUrls.length === 0)}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>
    </form>
  );
}
