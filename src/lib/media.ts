import { createUploadUrl } from "@/lib/uploads.functions";

export const SHORT_MAX_SECONDS = 60;
export const LONG_MAX_SECONDS = 300;

export type VideoFormat = "short" | "long";

export function maxSecondsFor(format: VideoFormat) {
  return format === "short" ? SHORT_MAX_SECONDS : LONG_MAX_SECONDS;
}

export function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Reads intrinsic duration (seconds) of a local video file. */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(duration) ? duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this video file"));
    };
    video.src = url;
  });
}

/** Grabs a JPEG poster frame at `atSecond`. */
export function capturePoster(file: File, atSecond: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSecond + 0.1, Math.max(0, video.duration - 0.1));
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob);
        },
        "image/jpeg",
        0.82,
      );
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
}

function extensionOf(name: string, fallback: string) {
  const ext = name.split(".").pop();
  return ext && /^[a-z0-9]{1,8}$/i.test(ext) ? ext.toLowerCase() : fallback;
}

/** Uploads a blob straight to Cloudflare R2 through a short-lived signed URL. */
export async function uploadToR2(
  blob: Blob,
  folder: "videos" | "images" | "avatars" | "posters",
  filename: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const contentType = blob.type || "application/octet-stream";
  const { uploadUrl, publicUrl } = await createUploadUrl({
    data: {
      folder,
      extension: extensionOf(filename, contentType.startsWith("video") ? "mp4" : "jpg"),
      contentType,
      sizeBytes: blob.size,
    },
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed — check your connection"));
    xhr.send(blob);
  });

  onProgress?.(100);
  return publicUrl;
}
