pub mod commands;
pub mod config;
pub mod errors;
pub mod ffmpeg;
pub mod jobs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(jobs::JobManager::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::jobs::cancel_job,
            commands::jobs::clear_finished_jobs,
            commands::jobs::enqueue_convert_job,
            commands::jobs::enqueue_null_job,
            commands::jobs::enqueue_screenshot_job,
            commands::jobs::get_job,
            commands::jobs::get_job_queue_config,
            commands::jobs::list_jobs,
            commands::jobs::set_job_queue_config,
            commands::media::check_ffmpeg_health,
            commands::media::probe_media
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
