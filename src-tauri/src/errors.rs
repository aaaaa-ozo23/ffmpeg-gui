use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorCategory {
    SidecarMissing,
    SpawnFailed,
    NonZeroExit,
    OutputParse,
    InvalidInput,
    FileNotFound,
    DirectoryInput,
    PermissionDenied,
}

#[derive(Debug, Clone, Serialize, thiserror::Error)]
#[error("{message}")]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub category: ErrorCategory,
    pub message: String,
    pub detail: Option<String>,
}

impl AppError {
    pub fn sidecar_missing(tool: &str, detail: impl Into<String>) -> Self {
        Self {
            category: ErrorCategory::SidecarMissing,
            message: format!(
                "{tool} sidecar is missing. Run `pnpm.cmd run sidecar:prepare` and restart the app."
            ),
            detail: Some(detail.into()),
        }
    }

    pub fn spawn_failed(tool: &str, detail: impl Into<String>) -> Self {
        Self {
            category: ErrorCategory::SpawnFailed,
            message: format!("Failed to start {tool} sidecar."),
            detail: Some(detail.into()),
        }
    }

    pub fn non_zero_exit(tool: &str, exit_code: Option<i32>, stderr: impl Into<String>) -> Self {
        Self {
            category: ErrorCategory::NonZeroExit,
            message: format!("{tool} exited with a non-zero status."),
            detail: Some(format!(
                "exitCode={}; stderr={}",
                exit_code
                    .map(|code| code.to_string())
                    .unwrap_or_else(|| "unknown".to_string()),
                stderr.into()
            )),
        }
    }

    pub fn output_parse(tool: &str, detail: impl Into<String>) -> Self {
        Self {
            category: ErrorCategory::OutputParse,
            message: format!("Failed to parse {tool} output."),
            detail: Some(detail.into()),
        }
    }

    pub fn invalid_input(message: impl Into<String>) -> Self {
        Self {
            category: ErrorCategory::InvalidInput,
            message: message.into(),
            detail: None,
        }
    }

    pub fn file_not_found(path: impl Into<String>) -> Self {
        let path = path.into();
        Self {
            category: ErrorCategory::FileNotFound,
            message: "媒体文件不存在或已被移动。".to_string(),
            detail: Some(path),
        }
    }

    pub fn directory_input(path: impl Into<String>) -> Self {
        let path = path.into();
        Self {
            category: ErrorCategory::DirectoryInput,
            message: "请选择具体媒体文件，不要选择文件夹。".to_string(),
            detail: Some(path),
        }
    }

    pub fn permission_denied(path: impl Into<String>, detail: impl Into<String>) -> Self {
        let path = path.into();
        Self {
            category: ErrorCategory::PermissionDenied,
            message: "无法读取媒体文件，请检查文件权限或是否被其它程序占用。".to_string(),
            detail: Some(format!("path={path}; {}", detail.into())),
        }
    }

    pub fn from_sidecar_start_error(tool: &str, detail: impl Into<String>) -> Self {
        let detail = detail.into();
        let lower = detail.to_lowercase();
        if lower.contains("os error 2")
            || lower.contains("not found")
            || lower.contains("cannot find")
            || lower.contains("no such file")
        {
            Self::sidecar_missing(tool, detail)
        } else {
            Self::spawn_failed(tool, detail)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_error_payload_as_camel_case() {
        let error = AppError::sidecar_missing("ffmpeg", "missing file");
        let json = serde_json::to_value(error).expect("error should serialize");

        assert_eq!(json["category"], "sidecarMissing");
        assert_eq!(json["detail"], "missing file");
        assert!(json["message"]
            .as_str()
            .expect("message should be a string")
            .contains("sidecar is missing"));
    }

    #[test]
    fn classifies_windows_missing_file_errors() {
        let error = AppError::from_sidecar_start_error(
            "ffprobe",
            "The system cannot find the file specified. (os error 2)",
        );

        assert_eq!(error.category, ErrorCategory::SidecarMissing);
    }
}
