import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppErrorPayload, FfmpegHealth, MediaInfo } from "../app/types";
import { MEDIA_DIALOG_FILTERS } from "./mediaFormats";

const TAURI_UNAVAILABLE_ERROR: AppErrorPayload = {
  category: "tauriUnavailable",
  message: "需要 Tauri 桌面运行时",
  detail: "请使用 `pnpm.cmd run tauri:dev` 启动应用；普通 Vite 预览不能调用 Rust 后端。",
};

function isTauriRuntime() {
  return (
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in
      (window as unknown as Record<string, unknown>)
  );
}

function normalizeAppError(
  error: unknown,
  fallbackMessage = "后端健康检查失败",
): AppErrorPayload {
  if (typeof error === "object" && error !== null) {
    const payload = error as Partial<AppErrorPayload>;
    if (typeof payload.message === "string") {
      return {
        category:
          typeof payload.category === "string"
            ? payload.category
            : "unknownBackendError",
        message: payload.message,
        detail: typeof payload.detail === "string" ? payload.detail : undefined,
      };
    }
  }

  return {
    category: "unknownBackendError",
    message: fallbackMessage,
    detail: error instanceof Error ? error.message : String(error),
  };
}

export async function checkFfmpegHealth(): Promise<FfmpegHealth> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<FfmpegHealth>("check_ffmpeg_health");
  } catch (error) {
    throw normalizeAppError(error);
  }
}

export async function selectMediaFile(): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  return await open({
    title: "选择媒体文件",
    multiple: false,
    directory: false,
    filters: MEDIA_DIALOG_FILTERS,
  });
}

export async function probeMedia(inputPath: string): Promise<MediaInfo> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<MediaInfo>("probe_media", { inputPath });
  } catch (error) {
    throw normalizeAppError(error, "媒体探测失败");
  }
}
