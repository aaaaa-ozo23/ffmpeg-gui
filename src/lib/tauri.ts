import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import type {
  AppErrorPayload,
  ConvertOutputFormat,
  ConvertRequest,
  FfmpegHealth,
  JobQueueConfig,
  JobRecord,
  JobsEvent,
  MediaInfo,
  ScreenshotRequest,
} from "../app/types";
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

export async function selectMediaFiles(): Promise<string[]> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  const selected = await open({
    title: "选择媒体文件",
    multiple: true,
    directory: false,
    filters: MEDIA_DIALOG_FILTERS,
  });

  if (!selected) {
    return [];
  }

  return Array.isArray(selected) ? selected : [selected];
}

export async function selectMediaFile(): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  const selected = await open({
    title: "选择媒体文件",
    multiple: false,
    directory: false,
    filters: MEDIA_DIALOG_FILTERS,
  });

  if (!selected) {
    return null;
  }

  return Array.isArray(selected) ? selected[0] ?? null : selected;
}

export async function selectOutputDirectory(): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  return await open({
    title: "选择输出目录",
    multiple: false,
    directory: true,
  });
}

export async function selectOutputFile(
  defaultPath: string,
  outputFormat: ConvertOutputFormat,
): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  return await save({
    title: "选择输出路径",
    defaultPath,
    filters: [
      {
        name: outputFormat.toUpperCase(),
        extensions: [outputFormat],
      },
    ],
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

export async function listJobs(): Promise<JobRecord[]> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobRecord[]>("list_jobs");
  } catch (error) {
    throw normalizeAppError(error, "读取任务列表失败");
  }
}

export async function getJobQueueConfig(): Promise<JobQueueConfig> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobQueueConfig>("get_job_queue_config");
  } catch (error) {
    throw normalizeAppError(error, "读取任务配置失败");
  }
}

export async function setJobQueueConfig(
  maxConcurrent: number,
): Promise<JobQueueConfig> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobQueueConfig>("set_job_queue_config", {
      maxConcurrent,
    });
  } catch (error) {
    throw normalizeAppError(error, "更新任务配置失败");
  }
}

export async function enqueueNullJob(
  inputPath: string,
  durationSec?: number,
): Promise<JobRecord> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobRecord>("enqueue_null_job", {
      inputPath,
      durationSec,
    });
  } catch (error) {
    throw normalizeAppError(error, "创建验证任务失败");
  }
}

export async function enqueueConvertJob(
  request: ConvertRequest,
): Promise<JobRecord> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobRecord>("enqueue_convert_job", { request });
  } catch (error) {
    throw normalizeAppError(error, "创建转换任务失败");
  }
}

export async function enqueueScreenshotJob(
  request: ScreenshotRequest,
): Promise<JobRecord> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobRecord>("enqueue_screenshot_job", { request });
  } catch (error) {
    throw normalizeAppError(error, "创建截图任务失败");
  }
}

export async function cancelJob(jobId: string): Promise<JobRecord> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobRecord>("cancel_job", { jobId });
  } catch (error) {
    throw normalizeAppError(error, "取消任务失败");
  }
}

export async function clearFinishedJobs(): Promise<JobRecord[]> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await invoke<JobRecord[]>("clear_finished_jobs");
  } catch (error) {
    throw normalizeAppError(error, "清理已完成任务失败");
  }
}

export async function listenToJobEvents(
  handler: (event: JobsEvent) => void,
): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    throw TAURI_UNAVAILABLE_ERROR;
  }

  try {
    return await listen<JobsEvent>("jobs-event", (event) => {
      handler(event.payload);
    });
  } catch (error) {
    throw normalizeAppError(error, "监听任务事件失败");
  }
}
