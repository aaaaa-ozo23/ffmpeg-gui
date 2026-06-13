import type { ConvertMediaKind, ConvertOutputFormat } from "../app/types";

export const VIDEO_EXTENSIONS = [
  "mp4",
  "m4v",
  "mov",
  "mkv",
  "webm",
  "avi",
  "wmv",
  "flv",
  "mpg",
  "mpeg",
  "ts",
  "m2ts",
  "3gp",
  "ogv",
  "vob",
] as const;

export const AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "flac",
  "m4a",
  "aac",
  "ogg",
  "opus",
  "wma",
  "aiff",
  "aif",
  "ape",
  "amr",
  "ac3",
  "mka",
] as const;

export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "tif",
  "tiff",
  "avif",
  "heic",
  "heif",
] as const;

export const SUPPORTED_MEDIA_EXTENSIONS = [
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
].filter((extension, index, extensions) => extensions.indexOf(extension) === index);

export const MEDIA_DIALOG_FILTERS = [
  {
    name: "所有支持的媒体",
    extensions: [...SUPPORTED_MEDIA_EXTENSIONS],
  },
  {
    name: "常见视频",
    extensions: [...VIDEO_EXTENSIONS],
  },
  {
    name: "常见音频",
    extensions: [...AUDIO_EXTENSIONS],
  },
  {
    name: "常见图片",
    extensions: [...IMAGE_EXTENSIONS],
  },
];

export type OutputFormatOption = {
  value: ConvertOutputFormat;
  label: string;
  mediaKind: ConvertMediaKind;
};

export const VIDEO_OUTPUT_FORMATS: OutputFormatOption[] = [
  { value: "mp4", label: "MP4", mediaKind: "video" },
  { value: "mkv", label: "MKV", mediaKind: "video" },
  { value: "mov", label: "MOV", mediaKind: "video" },
  { value: "webm", label: "WebM", mediaKind: "video" },
];

export const AUDIO_OUTPUT_FORMATS: OutputFormatOption[] = [
  { value: "mp3", label: "MP3", mediaKind: "audio" },
  { value: "wav", label: "WAV", mediaKind: "audio" },
  { value: "flac", label: "FLAC", mediaKind: "audio" },
  { value: "aac", label: "AAC", mediaKind: "audio" },
  { value: "m4a", label: "M4A", mediaKind: "audio" },
  { value: "ogg", label: "OGG", mediaKind: "audio" },
  { value: "opus", label: "Opus", mediaKind: "audio" },
];

export const IMAGE_OUTPUT_FORMATS: OutputFormatOption[] = [
  { value: "png", label: "PNG", mediaKind: "image" },
  { value: "jpg", label: "JPG", mediaKind: "image" },
  { value: "webp", label: "WebP", mediaKind: "image" },
  { value: "bmp", label: "BMP", mediaKind: "image" },
  { value: "tiff", label: "TIFF", mediaKind: "image" },
];

export function getOutputFormats(mediaKind: ConvertMediaKind | undefined) {
  if (mediaKind === "video") {
    return VIDEO_OUTPUT_FORMATS;
  }

  if (mediaKind === "audio") {
    return AUDIO_OUTPUT_FORMATS;
  }

  if (mediaKind === "image") {
    return IMAGE_OUTPUT_FORMATS;
  }

  return [];
}
