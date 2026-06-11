use crate::{
    errors::AppError,
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
