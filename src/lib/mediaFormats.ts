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
