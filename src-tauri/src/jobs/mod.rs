use std::{
    collections::HashMap,
    sync::{Arc, Mutex, MutexGuard},
    time::{SystemTime, UNIX_EPOCH},
};

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::{process::CommandChild, process::CommandEvent, ShellExt};
use uuid::Uuid;

use crate::{
    errors::{AppError, ErrorCategory},
    ffmpeg::{
        command_builder::null_output_args,
        probe::validate_media_path,
        progress::{parse_out_time_ms, progress_percent},
    },
};

const JOBS_EVENT: &str = "jobs-event";
const DEFAULT_MAX_CONCURRENT: u8 = 1;
const MIN_MAX_CONCURRENT: u8 = 1;
const MAX_MAX_CONCURRENT: u8 = 4;
const MAX_LOG_LINES: usize = 200;
const MAX_LOG_BYTES: usize = 128 * 1024;

#[derive(Clone, Default)]
pub struct JobManager {
    inner: Arc<Mutex<JobState>>,
}

#[derive(Debug)]
struct JobState {
    jobs: Vec<JobRecord>,
    active: HashMap<String, RunningProcess>,
    max_concurrent: u8,
}

impl Default for JobState {
    fn default() -> Self {
        Self {
            jobs: Vec::new(),
            active: HashMap::new(),
            max_concurrent: DEFAULT_MAX_CONCURRENT,
        }
    }
}

#[derive(Debug)]
struct RunningProcess {
    child: Option<CommandChild>,
}

impl RunningProcess {
    fn reserved() -> Self {
        Self { child: None }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum JobKind {
    NullOutput,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum JobStatus {
    Queued,
    Running,
    Success,
    Failed,
    Canceling,
    Canceled,
}

impl JobStatus {
    fn is_terminal(&self) -> bool {
        matches!(self, Self::Success | Self::Failed | Self::Canceled)
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRecord {
    pub id: String,
    pub kind: JobKind,
    pub title: String,
    pub input_path: String,
    pub output_path: Option<String>,
    pub status: JobStatus,
    pub progress_pct: Option<u8>,
    pub duration_sec: Option<f64>,
    pub created_at: u64,
    pub started_at: Option<u64>,
    pub finished_at: Option<u64>,
    pub args: Vec<String>,
    pub stdout: Vec<String>,
    pub stderr: Vec<String>,
    pub stdout_truncated: bool,
    pub stderr_truncated: bool,
    pub exit_code: Option<i32>,
    pub error_category: Option<ErrorCategory>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobQueueConfig {
    pub max_concurrent: u8,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobLogEntry {
    pub stream: JobLogStream,
    pub line: String,
    pub timestamp: u64,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum JobLogStream {
    Stdout,
    Stderr,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobsEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub job: JobRecord,
    pub log: Option<JobLogEntry>,
}

impl JobManager {
    pub fn list_jobs(&self) -> Vec<JobRecord> {
        self.lock_state().jobs.clone()
    }

    pub fn get_job(&self, job_id: &str) -> Result<JobRecord, AppError> {
        self.lock_state()
            .jobs
            .iter()
            .find(|job| job.id == job_id)
            .cloned()
            .ok_or_else(|| AppError::job_not_found(job_id))
    }

    pub fn get_queue_config(&self) -> JobQueueConfig {
        JobQueueConfig {
            max_concurrent: self.lock_state().max_concurrent,
        }
    }

    pub fn set_queue_config(
        &self,
        app: AppHandle,
        max_concurrent: u8,
    ) -> Result<JobQueueConfig, AppError> {
        validate_max_concurrent(max_concurrent)?;

        {
            let mut state = self.lock_state();
            state.max_concurrent = max_concurrent;
        }

        self.dispatch(app);
        Ok(JobQueueConfig { max_concurrent })
    }

    pub fn enqueue_null_job(
        &self,
        app: AppHandle,
        input_path: String,
        duration_sec: Option<f64>,
    ) -> Result<JobRecord, AppError> {
        validate_media_path(&input_path)?;

        let args = null_output_args(&input_path);
        let record = JobRecord::new_null_output(input_path, duration_sec, args);

        {
            let mut state = self.lock_state();
            state.jobs.push(record.clone());
        }

        emit_job_event(&app, "jobQueued", record.clone(), None);
        self.dispatch(app);

        Ok(record)
    }

    pub fn cancel_job(&self, app: AppHandle, job_id: &str) -> Result<JobRecord, AppError> {
        let mut child_to_kill = None;
        let record = {
            let mut state = self.lock_state();
            let job_index = state
                .jobs
                .iter()
                .position(|job| job.id == job_id)
                .ok_or_else(|| AppError::job_not_found(job_id))?;

            match state.jobs[job_index].status {
                JobStatus::Queued => {
                    state.jobs[job_index].status = JobStatus::Canceled;
                    state.jobs[job_index].finished_at = Some(now_ms());
                    state.jobs[job_index].progress_pct = None;
                }
                JobStatus::Running | JobStatus::Canceling => {
                    state.jobs[job_index].status = JobStatus::Canceling;
                    if let Some(process) = state.active.get_mut(job_id) {
                        child_to_kill = process.child.take();
                    }
                }
                _ => return Err(AppError::job_already_finished(job_id)),
            }

            state.jobs[job_index].clone()
        };

        if let Some(child) = child_to_kill {
            child
                .kill()
                .map_err(|error| AppError::cancel_failed(job_id, error.to_string()))?;
        }

        emit_job_event(&app, "jobUpdated", record.clone(), None);
        self.dispatch(app);

        Ok(record)
    }

    pub fn clear_finished_jobs(&self) -> Vec<JobRecord> {
        let mut state = self.lock_state();
        state.jobs.retain(|job| !job.status.is_terminal());
        state.jobs.clone()
    }

    pub fn dispatch(&self, app: AppHandle) {
        loop {
            let reserved = {
                let mut state = self.lock_state();
                state.reserve_next_queued()
            };

            let Some(job) = reserved else {
                break;
            };

            let spawn_result = app
                .shell()
                .sidecar("ffmpeg")
                .map_err(|error| AppError::from_sidecar_start_error("FFmpeg", error.to_string()))
                .and_then(|command| {
                    command.args(job.args.clone()).spawn().map_err(|error| {
                        AppError::from_sidecar_start_error("FFmpeg", error.to_string())
                    })
                });

            match spawn_result {
                Ok((mut receiver, child)) => {
                    let mut child_to_kill = Some(child);
                    let updated = {
                        let mut state = self.lock_state();
                        let is_canceling = state
                            .get_job(&job.id)
                            .map(|current| current.status == JobStatus::Canceling)
                            .unwrap_or_default();
                        if let Some(process) = state.active.get_mut(&job.id) {
                            if is_canceling {
                                None
                            } else {
                                process.child = child_to_kill.take();
                                state.get_job(&job.id).cloned()
                            }
                        } else {
                            None
                        }
                    };

                    if let Some(child) = child_to_kill {
                        let _ = child.kill();
                    }

                    if let Some(updated) = updated {
                        emit_job_event(&app, "jobStarted", updated, None);
                    }

                    let manager = self.clone();
                    let task_app = app.clone();
                    let job_id = job.id.clone();
                    tauri::async_runtime::spawn(async move {
                        while let Some(event) = receiver.recv().await {
                            match event {
                                CommandEvent::Stdout(bytes) => {
                                    manager.handle_stdout(&task_app, &job_id, bytes);
                                }
                                CommandEvent::Stderr(bytes) => {
                                    manager.handle_stderr(&task_app, &job_id, bytes);
                                }
                                CommandEvent::Error(error) => {
                                    manager.fail_running_job(
                                        &task_app,
                                        &job_id,
                                        ErrorCategory::SpawnFailed,
                                        error,
                                    );
                                    break;
                                }
                                CommandEvent::Terminated(payload) => {
                                    manager.finalize_job(&task_app, &job_id, payload.code);
                                    break;
                                }
                                _ => {}
                            }
                        }
                    });
                }
                Err(error) => {
                    let failed = {
                        let mut state = self.lock_state();
                        state.active.remove(&job.id);
                        state.mark_failed(
                            &job.id,
                            error.category.clone(),
                            error.message.clone(),
                            None,
                        )
                    };

                    if let Some(failed) = failed {
                        emit_job_event(&app, "jobUpdated", failed, None);
                    }
                }
            }
        }
    }

    fn handle_stdout(&self, app: &AppHandle, job_id: &str, bytes: Vec<u8>) {
        let lines = decode_lines(bytes);
        for line in lines {
            let (updated, log_entry) = {
                let mut state = self.lock_state();
                let Some(job) = state.get_job_mut(job_id) else {
                    return;
                };

                append_log_line(&mut job.stdout, &mut job.stdout_truncated, line.clone());
                if let Some(out_time_us) = parse_out_time_ms(&line) {
                    if let Some(progress) = progress_percent(out_time_us, job.duration_sec) {
                        job.progress_pct = Some(progress);
                    }
                }

                let log_entry = Some(JobLogEntry {
                    stream: JobLogStream::Stdout,
                    line,
                    timestamp: now_ms(),
                    truncated: job.stdout_truncated,
                });
                (job.clone(), log_entry)
            };

            emit_job_event(app, "jobLog", updated, log_entry);
        }
    }

    fn handle_stderr(&self, app: &AppHandle, job_id: &str, bytes: Vec<u8>) {
        let lines = decode_lines(bytes);
        for line in lines {
            let (updated, log_entry) = {
                let mut state = self.lock_state();
                let Some(job) = state.get_job_mut(job_id) else {
                    return;
                };

                append_log_line(&mut job.stderr, &mut job.stderr_truncated, line.clone());
                let log_entry = Some(JobLogEntry {
                    stream: JobLogStream::Stderr,
                    line,
                    timestamp: now_ms(),
                    truncated: job.stderr_truncated,
                });
                (job.clone(), log_entry)
            };

            emit_job_event(app, "jobLog", updated, log_entry);
        }
    }

    fn finalize_job(&self, app: &AppHandle, job_id: &str, exit_code: Option<i32>) {
        let updated = {
            let mut state = self.lock_state();
            state.active.remove(job_id);
            let Some(job) = state.get_job_mut(job_id) else {
                return;
            };

            job.exit_code = exit_code;
            job.finished_at = Some(now_ms());

            if job.status == JobStatus::Canceling {
                job.status = JobStatus::Canceled;
                job.progress_pct = None;
            } else if exit_code == Some(0) {
                job.status = JobStatus::Success;
                job.progress_pct = Some(100);
            } else {
                job.status = JobStatus::Failed;
                job.error_category = Some(ErrorCategory::NonZeroExit);
                job.error_message = Some(format!(
                    "FFmpeg exited with code {}.",
                    exit_code
                        .map(|code| code.to_string())
                        .unwrap_or_else(|| "unknown".to_string())
                ));
            }

            job.clone()
        };

        emit_job_event(app, "jobFinished", updated, None);
        self.dispatch(app.clone());
    }

    fn fail_running_job(
        &self,
        app: &AppHandle,
        job_id: &str,
        category: ErrorCategory,
        message: String,
    ) {
        let updated = {
            let mut state = self.lock_state();
            state.active.remove(job_id);
            state.mark_failed(job_id, category, message, None)
        };

        if let Some(updated) = updated {
            emit_job_event(app, "jobUpdated", updated, None);
        }

        self.dispatch(app.clone());
    }

    fn lock_state(&self) -> MutexGuard<'_, JobState> {
        self.inner
            .lock()
            .expect("job state lock should not be poisoned")
    }
}

impl JobRecord {
    fn new_null_output(input_path: String, duration_sec: Option<f64>, args: Vec<String>) -> Self {
        let file_name = input_path
            .replace('\\', "/")
            .split('/')
            .filter(|part| !part.is_empty())
            .last()
            .unwrap_or("媒体文件")
            .to_string();

        Self {
            id: Uuid::new_v4().to_string(),
            kind: JobKind::NullOutput,
            title: format!("验证任务系统：{file_name}"),
            input_path,
            output_path: Some("NUL".to_string()),
            status: JobStatus::Queued,
            progress_pct: None,
            duration_sec,
            created_at: now_ms(),
            started_at: None,
            finished_at: None,
            args,
            stdout: Vec::new(),
            stderr: Vec::new(),
            stdout_truncated: false,
            stderr_truncated: false,
            exit_code: None,
            error_category: None,
            error_message: None,
        }
    }
}

impl JobState {
    fn reserve_next_queued(&mut self) -> Option<JobRecord> {
        if self.active.len() >= usize::from(self.max_concurrent) {
            return None;
        }

        let index = self
            .jobs
            .iter()
            .position(|job| job.status == JobStatus::Queued)?;

        let now = now_ms();
        let job = &mut self.jobs[index];
        job.status = JobStatus::Running;
        job.started_at = Some(now);
        job.progress_pct = Some(0);
        job.error_category = None;
        job.error_message = None;
        self.active
            .insert(job.id.clone(), RunningProcess::reserved());

        Some(job.clone())
    }

    fn get_job(&self, job_id: &str) -> Option<&JobRecord> {
        self.jobs.iter().find(|job| job.id == job_id)
    }

    fn get_job_mut(&mut self, job_id: &str) -> Option<&mut JobRecord> {
        self.jobs.iter_mut().find(|job| job.id == job_id)
    }

    fn mark_failed(
        &mut self,
        job_id: &str,
        category: ErrorCategory,
        message: String,
        exit_code: Option<i32>,
    ) -> Option<JobRecord> {
        let job = self.get_job_mut(job_id)?;
        job.status = JobStatus::Failed;
        job.finished_at = Some(now_ms());
        job.exit_code = exit_code;
        job.error_category = Some(category);
        job.error_message = Some(message);
        Some(job.clone())
    }
}

fn emit_job_event(
    app: &AppHandle,
    event_type: impl Into<String>,
    job: JobRecord,
    log: Option<JobLogEntry>,
) {
    let _ = app.emit(
        JOBS_EVENT,
        JobsEvent {
            event_type: event_type.into(),
            job,
            log,
        },
    );
}

fn validate_max_concurrent(max_concurrent: u8) -> Result<(), AppError> {
    if (MIN_MAX_CONCURRENT..=MAX_MAX_CONCURRENT).contains(&max_concurrent) {
        Ok(())
    } else {
        Err(AppError::invalid_job_config(format!(
            "并发数必须在 {MIN_MAX_CONCURRENT} 到 {MAX_MAX_CONCURRENT} 之间。"
        )))
    }
}

fn append_log_line(lines: &mut Vec<String>, truncated: &mut bool, line: String) {
    if line.is_empty() {
        return;
    }

    lines.push(line);

    while lines.len() > MAX_LOG_LINES {
        lines.remove(0);
        *truncated = true;
    }

    while total_log_bytes(lines) > MAX_LOG_BYTES {
        lines.remove(0);
        *truncated = true;
    }
}

fn total_log_bytes(lines: &[String]) -> usize {
    lines.iter().map(|line| line.len()).sum()
}

fn decode_lines(bytes: Vec<u8>) -> Vec<String> {
    String::from_utf8_lossy(&bytes)
        .lines()
        .map(str::trim_end)
        .filter(|line| !line.is_empty())
        .map(ToString::to_string)
        .collect()
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn queued_job(name: &str) -> JobRecord {
        JobRecord {
            id: name.to_string(),
            kind: JobKind::NullOutput,
            title: name.to_string(),
            input_path: format!(r"D:\媒体 Tests\{name} 中文 sample.mp4"),
            output_path: Some("NUL".to_string()),
            status: JobStatus::Queued,
            progress_pct: None,
            duration_sec: Some(10.0),
            created_at: 1,
            started_at: None,
            finished_at: None,
            args: null_output_args(format!(r"D:\媒体 Tests\{name} 中文 sample.mp4")),
            stdout: Vec::new(),
            stderr: Vec::new(),
            stdout_truncated: false,
            stderr_truncated: false,
            exit_code: None,
            error_category: None,
            error_message: None,
        }
    }

    #[test]
    fn validates_concurrency_limits() {
        assert!(validate_max_concurrent(1).is_ok());
        assert!(validate_max_concurrent(4).is_ok());
        assert!(validate_max_concurrent(0).is_err());
        assert!(validate_max_concurrent(5).is_err());
    }

    #[test]
    fn reserves_fifo_jobs_up_to_max_concurrent() {
        let mut state = JobState {
            jobs: vec![queued_job("a"), queued_job("b"), queued_job("c")],
            active: HashMap::new(),
            max_concurrent: 2,
        };

        assert_eq!(
            state.reserve_next_queued().map(|job| job.id),
            Some("a".to_string())
        );
        assert_eq!(
            state.reserve_next_queued().map(|job| job.id),
            Some("b".to_string())
        );
        assert!(state.reserve_next_queued().is_none());
        assert_eq!(state.jobs[0].status, JobStatus::Running);
        assert_eq!(state.jobs[1].status, JobStatus::Running);
        assert_eq!(state.jobs[2].status, JobStatus::Queued);
    }

    #[test]
    fn lowering_concurrency_does_not_remove_running_reservations() {
        let mut state = JobState {
            jobs: vec![queued_job("a"), queued_job("b")],
            active: HashMap::new(),
            max_concurrent: 2,
        };

        assert!(state.reserve_next_queued().is_some());
        state.max_concurrent = 1;

        assert_eq!(state.active.len(), 1);
        assert!(state.reserve_next_queued().is_none());
        assert_eq!(state.jobs[1].status, JobStatus::Queued);
    }

    #[test]
    fn marks_success_failed_and_canceled_statuses() {
        assert!(JobStatus::Success.is_terminal());
        assert!(JobStatus::Failed.is_terminal());
        assert!(JobStatus::Canceled.is_terminal());
        assert!(!JobStatus::Queued.is_terminal());
        assert!(!JobStatus::Running.is_terminal());
    }

    #[test]
    fn appends_and_truncates_logs() {
        let mut lines = Vec::new();
        let mut truncated = false;

        for index in 0..205 {
            append_log_line(&mut lines, &mut truncated, format!("line {index}"));
        }

        assert_eq!(lines.len(), MAX_LOG_LINES);
        assert!(truncated);
        assert_eq!(lines[0], "line 5");
    }

    #[test]
    fn decodes_multiple_output_lines() {
        assert_eq!(
            decode_lines(b"out_time_ms=1000000\nprogress=continue\r\n".to_vec()),
            vec!["out_time_ms=1000000", "progress=continue"]
        );
    }
}
