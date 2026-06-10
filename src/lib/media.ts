import type { MediaInfo, MediaSummary } from "../app/types";
import { IMAGE_EXTENSIONS } from "./mediaFormats";

const IMAGE_CODECS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "mjpeg",
  "png",
  "tiff",
  "webp",
]);

const CONTAINER_BY_EXTENSION: Record<string, string> = {
  "3gp": "3GP",
  aac: "AAC",
  ac3: "AC-3",
  aif: "AIFF",
  aiff: "AIFF",
  amr: "AMR",
  ape: "APE",
  avi: "AVI",
  avif: "AVIF",
  bmp: "BMP",
  flac: "FLAC",
  flv: "FLV",
  gif: "GIF",
  heic: "HEIC",
  heif: "HEIF",
  jpeg: "JPEG",
  jpg: "JPEG",
  m2ts: "M2TS",
  m4a: "M4A",
  m4v: "M4V",
  mka: "MKA",
  mkv: "MKV",
  mov: "MOV",
  mp3: "MP3",
  mp4: "MP4",
  mpeg: "MPEG",
  mpg: "MPEG",
  ogg: "OGG",
  ogv: "OGV",
  opus: "OPUS",
  png: "PNG",
  tif: "TIFF",
  tiff: "TIFF",
  ts: "TS",
  vob: "VOB",
  wav: "WAV",
  webm: "WEBM",
  webp: "WEBP",
  wma: "WMA",
  wmv: "WMV",
};

export function toMediaSummary(media: MediaInfo): MediaSummary {
  const fileName = extractFileName(media.path);
  const extension = extractExtension(fileName);
  const firstVideo = media.videoStreams[0];
  const firstAudio = media.audioStreams[0];
  const mediaKind = inferMediaKind(media, extension);

  return {
    fileName,
    path: media.path,
    mediaKind,
    duration: formatDuration(media.durationSec, mediaKind),
    container: formatContainer(media.formatName, extension),
    resolution:
      firstVideo?.width && firstVideo.height
        ? `${firstVideo.width} x ${firstVideo.height}`
        : "无视频流",
    videoCodec: formatCodec(firstVideo?.codecName),
    audioCodec: formatCodec(firstAudio?.codecName),
    subtitleTracks: media.subtitleStreams.length,
    size: formatFileSize(media.sizeBytes),
  };
}

function extractFileName(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || path || "未命名文件";
}

function extractExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function inferMediaKind(media: MediaInfo, extension: string) {
  const hasVideo = media.videoStreams.length > 0;
  const hasAudio = media.audioStreams.length > 0;
  const firstVideoCodec = media.videoStreams[0]?.codecName;
  const formatName = media.formatName?.toLowerCase() ?? "";
  const isImageByExtension = IMAGE_EXTENSIONS.some(
    (imageExtension) => imageExtension === extension,
  );
  const isImageByProbe =
    Boolean(firstVideoCodec && IMAGE_CODECS.has(firstVideoCodec)) ||
    formatName.includes("image2");

  if (hasVideo && !hasAudio && (isImageByExtension || isImageByProbe)) {
    return "图片";
  }

  if (hasVideo) {
    return "视频";
  }

  if (hasAudio) {
    return "音频";
  }

  if (media.subtitleStreams.length > 0) {
    return "字幕";
  }

  return "媒体";
}

function formatContainer(formatName: string | undefined, extension: string) {
  const extensionContainer = CONTAINER_BY_EXTENSION[extension];
  if (extensionContainer) {
    return extensionContainer;
  }

  const firstFormat = formatName?.split(",")[0]?.trim();
  return firstFormat ? firstFormat.toUpperCase() : "未知";
}

function formatDuration(durationSec: number | undefined, mediaKind: string) {
  if (mediaKind === "图片") {
    return "不适用";
  }

  if (durationSec === undefined || !Number.isFinite(durationSec)) {
    return "未知";
  }

  const totalSeconds = Math.max(0, Math.round(durationSec));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function formatFileSize(sizeBytes?: number) {
  if (sizeBytes === undefined || !Number.isFinite(sizeBytes)) {
    return "未知";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${value} ${units[unitIndex]}`;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatCodec(codecName?: string) {
  if (!codecName || codecName === "unknown") {
    return "无";
  }

  const displayNames: Record<string, string> = {
    aac: "AAC",
    ac3: "AC-3",
    alac: "ALAC",
    amr_nb: "AMR-NB",
    amr_wb: "AMR-WB",
    ape: "APE",
    av1: "AV1",
    avif: "AVIF",
    bmp: "BMP",
    eac3: "E-AC-3",
    flac: "FLAC",
    gif: "GIF",
    h264: "H.264",
    hevc: "H.265",
    mjpeg: "JPEG",
    mp3: "MP3",
    mpeg2video: "MPEG-2",
    mpeg4: "MPEG-4",
    opus: "Opus",
    pcm_s16le: "PCM",
    pcm_s24le: "PCM",
    png: "PNG",
    prores: "ProRes",
    subrip: "SRT",
    tiff: "TIFF",
    vorbis: "Vorbis",
    vp8: "VP8",
    vp9: "VP9",
    webp: "WEBP",
    wmav2: "WMA",
    wmv3: "WMV",
  };

  return displayNames[codecName] ?? codecName.toUpperCase();
}
