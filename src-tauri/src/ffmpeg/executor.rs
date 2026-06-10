use crate::errors::AppError;
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SidecarTool {
    Ffmpeg,
    Ffprobe,
}

impl SidecarTool {
    pub fn command_name(self) -> &'static str {
        match self {
            Self::Ffmpeg => "ffmpeg",
            Self::Ffprobe => "ffprobe",
        }
    }

    pub fn display_name(self) -> &'static str {
        match self {
            Self::Ffmpeg => "FFmpeg",
            Self::Ffprobe => "FFprobe",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SidecarOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

pub async fn run_sidecar(
    app: &tauri::AppHandle,
    tool: SidecarTool,
    args: Vec<String>,
) -> Result<SidecarOutput, AppError> {
    let command = app
        .shell()
        .sidecar(tool.command_name())
        .map_err(|error| {
            AppError::from_sidecar_start_error(tool.display_name(), error.to_string())
        })?
        .args(args);

    let output = command.output().await.map_err(|error| {
        AppError::from_sidecar_start_error(tool.display_name(), error.to_string())
    })?;

    let stdout = String::from_utf8_lossy(&output.stdout)
        .trim_end()
        .to_string();
    let stderr = String::from_utf8_lossy(&output.stderr)
        .trim_end()
        .to_string();
    let exit_code = output.status.code();

    if !output.status.success() {
        return Err(AppError::non_zero_exit(
            tool.display_name(),
            exit_code,
            stderr,
        ));
    }

    Ok(SidecarOutput {
        stdout,
        stderr,
        exit_code,
    })
}
