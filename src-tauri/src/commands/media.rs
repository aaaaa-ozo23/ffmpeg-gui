use crate::{
    errors::AppError,
    ffmpeg::{
        command_builder::version_args,
        executor::{run_sidecar, SidecarTool},
        version::{parse_tool_version, FfmpegHealth, TARGET_TRIPLE},
    },
};

#[tauri::command]
pub async fn check_ffmpeg_health(app: tauri::AppHandle) -> Result<FfmpegHealth, AppError> {
    let ffmpeg_output = run_sidecar(&app, SidecarTool::Ffmpeg, version_args()).await?;
    let ffprobe_output = run_sidecar(&app, SidecarTool::Ffprobe, version_args()).await?;

    let ffmpeg_text = first_non_empty(&ffmpeg_output.stdout, &ffmpeg_output.stderr);
    let ffprobe_text = first_non_empty(&ffprobe_output.stdout, &ffprobe_output.stderr);

    Ok(FfmpegHealth {
        target_triple: TARGET_TRIPLE.to_string(),
        ffmpeg: parse_tool_version("FFmpeg", ffmpeg_text)?,
        ffprobe: parse_tool_version("FFprobe", ffprobe_text)?,
    })
}

fn first_non_empty<'a>(stdout: &'a str, stderr: &'a str) -> &'a str {
    if stdout.trim().is_empty() {
        stderr
    } else {
        stdout
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_stdout_for_version_text() {
        assert_eq!(first_non_empty("ffmpeg version", "error"), "ffmpeg version");
    }

    #[test]
    fn falls_back_to_stderr_for_version_text() {
        assert_eq!(first_non_empty("", "ffprobe version"), "ffprobe version");
    }
}
