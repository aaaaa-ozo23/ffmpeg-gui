use crate::{
    errors::AppError,
    ffmpeg::command_builder::{
        AudioExtractRequest, ConvertRequest, ScreenshotRequest, SubtitleRequest, TrimRequest,
    },
    jobs::{JobManager, JobQueueConfig, JobRecord},
};

#[tauri::command]
pub fn list_jobs(job_manager: tauri::State<'_, JobManager>) -> Vec<JobRecord> {
    job_manager.list_jobs()
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn get_job(
    job_manager: tauri::State<'_, JobManager>,
    jobId: String,
) -> Result<JobRecord, AppError> {
    job_manager.get_job(&jobId)
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn enqueue_null_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    inputPath: String,
    durationSec: Option<f64>,
) -> Result<JobRecord, AppError> {
    job_manager.enqueue_null_job(app, inputPath, durationSec)
}

#[tauri::command]
pub fn enqueue_convert_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    request: ConvertRequest,
) -> Result<JobRecord, AppError> {
    job_manager.enqueue_convert_job(app, request)
}

#[tauri::command]
pub fn enqueue_trim_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    request: TrimRequest,
) -> Result<JobRecord, AppError> {
    job_manager.enqueue_trim_job(app, request)
}

#[tauri::command]
pub fn enqueue_screenshot_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    request: ScreenshotRequest,
) -> Result<JobRecord, AppError> {
    job_manager.enqueue_screenshot_job(app, request)
}

#[tauri::command]
pub fn enqueue_audio_extract_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    request: AudioExtractRequest,
) -> Result<JobRecord, AppError> {
    job_manager.enqueue_audio_extract_job(app, request)
}

#[tauri::command]
pub fn enqueue_subtitle_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    request: SubtitleRequest,
) -> Result<JobRecord, AppError> {
    job_manager.enqueue_subtitle_job(app, request)
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn cancel_job(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    jobId: String,
) -> Result<JobRecord, AppError> {
    job_manager.cancel_job(app, &jobId)
}

#[tauri::command]
pub fn clear_finished_jobs(job_manager: tauri::State<'_, JobManager>) -> Vec<JobRecord> {
    job_manager.clear_finished_jobs()
}

#[tauri::command]
pub fn get_job_queue_config(job_manager: tauri::State<'_, JobManager>) -> JobQueueConfig {
    job_manager.get_queue_config()
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn set_job_queue_config(
    app: tauri::AppHandle,
    job_manager: tauri::State<'_, JobManager>,
    maxConcurrent: u8,
) -> Result<JobQueueConfig, AppError> {
    job_manager.set_queue_config(app, maxConcurrent)
}
