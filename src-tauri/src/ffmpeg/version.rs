use serde::Serialize;

use crate::errors::AppError;

pub const TARGET_TRIPLE: &str = "x86_64-pc-windows-msvc";

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolVersion {
    pub name: String,
    pub version_line: String,
    pub configuration_line: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FfmpegHealth {
    pub target_triple: String,
    pub ffmpeg: ToolVersion,
    pub ffprobe: ToolVersion,
}

pub fn parse_tool_version(tool_name: &str, output: &str) -> Result<ToolVersion, AppError> {
    let version_line = output
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .ok_or_else(|| AppError::output_parse(tool_name, "version output was empty"))?;

    if !version_line.contains("version") {
        return Err(AppError::output_parse(
            tool_name,
            format!("first output line did not look like a version line: {version_line}"),
        ));
    }

    let configuration_line = output
        .lines()
        .map(str::trim)
        .find(|line| line.starts_with("configuration:"))
        .map(ToOwned::to_owned);

    Ok(ToolVersion {
        name: tool_name.to_string(),
        version_line: version_line.to_string(),
        configuration_line,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_version_and_configuration_lines() {
        let output = "\
ffmpeg version 8.0.1-full_build-www.gyan.dev Copyright
built with gcc 15.2.0
configuration: --enable-gpl --enable-version3
libavutil 60.8.100";

        let parsed = parse_tool_version("FFmpeg", output).expect("version should parse");

        assert_eq!(
            parsed.version_line,
            "ffmpeg version 8.0.1-full_build-www.gyan.dev Copyright"
        );
        assert_eq!(
            parsed.configuration_line.as_deref(),
            Some("configuration: --enable-gpl --enable-version3")
        );
    }

    #[test]
    fn rejects_empty_output() {
        let error = parse_tool_version("FFprobe", "").expect_err("empty output should fail");

        assert_eq!(error.category, crate::errors::ErrorCategory::OutputParse);
    }
}
