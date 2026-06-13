use std::path::Path;

use serde::Deserialize;

use crate::{errors::AppError, ffmpeg::probe::validate_media_path};

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertRequest {
    pub input_path: String,
    pub output_path: String,
    pub media_kind: ConvertMediaKind,
    pub output_format: ConvertOutputFormat,
    pub mode: ConvertMode,
    pub video_codec: ConvertVideoCodec,
    pub audio_codec: ConvertAudioCodec,
    pub overwrite: bool,
    pub duration_sec: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConvertMediaKind {
    Video,
    Audio,
    Image,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConvertMode {
    Auto,
    Copy,
    Custom,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConvertVideoCodec {
    Copy,
    H264,
    H265,
    Vp9,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConvertAudioCodec {
    Copy,
    Aac,
    Mp3,
    Flac,
    Opus,
    Vorbis,
    PcmS16le,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConvertOutputFormat {
    Mp4,
    Mkv,
    Mov,
    Webm,
    Mp3,
    Wav,
    Flac,
    Aac,
    M4a,
    Ogg,
    Opus,
    Png,
    Jpg,
    Webp,
    Bmp,
    Tiff,
}

impl ConvertOutputFormat {
    pub fn extension(self) -> &'static str {
        match self {
            Self::Mp4 => "mp4",
            Self::Mkv => "mkv",
            Self::Mov => "mov",
            Self::Webm => "webm",
            Self::Mp3 => "mp3",
            Self::Wav => "wav",
            Self::Flac => "flac",
            Self::Aac => "aac",
            Self::M4a => "m4a",
            Self::Ogg => "ogg",
            Self::Opus => "opus",
            Self::Png => "png",
            Self::Jpg => "jpg",
            Self::Webp => "webp",
            Self::Bmp => "bmp",
            Self::Tiff => "tiff",
        }
    }

    fn media_kind(self) -> ConvertMediaKind {
        match self {
            Self::Mp4 | Self::Mkv | Self::Mov | Self::Webm => ConvertMediaKind::Video,
            Self::Mp3 | Self::Wav | Self::Flac | Self::Aac | Self::M4a | Self::Ogg | Self::Opus => {
                ConvertMediaKind::Audio
            }
            Self::Png | Self::Jpg | Self::Webp | Self::Bmp | Self::Tiff => ConvertMediaKind::Image,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CommandArgs {
    args: Vec<String>,
}

impl CommandArgs {
    pub fn new() -> Self {
        Self { args: Vec::new() }
    }

    pub fn arg(mut self, value: impl Into<String>) -> Self {
        self.args.push(value.into());
        self
    }

    pub fn args<I, S>(mut self, values: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.args.extend(values.into_iter().map(Into::into));
        self
    }

    pub fn input_path(mut self, path: impl AsRef<Path>) -> Self {
        self.args.push("-i".to_string());
        self.args.push(path.as_ref().to_string_lossy().into_owned());
        self
    }

    pub fn into_vec(self) -> Vec<String> {
        self.args
    }
}

pub fn version_args() -> Vec<String> {
    CommandArgs::new().arg("-version").into_vec()
}

pub fn probe_args(input_path: impl AsRef<Path>) -> Vec<String> {
    CommandArgs::new()
        .args(["-v", "error", "-print_format", "json", "-show_format"])
        .arg("-show_streams")
        .arg(input_path.as_ref().to_string_lossy().into_owned())
        .into_vec()
}

pub fn null_output_args(input_path: impl AsRef<Path>) -> Vec<String> {
    CommandArgs::new()
        .args(["-hide_banner", "-nostdin", "-re"])
        .input_path(input_path)
        .args([
            "-map",
            "0:v?",
            "-map",
            "0:a?",
            "-f",
            "null",
            "-progress",
            "pipe:1",
            "-nostats",
            "NUL",
        ])
        .into_vec()
}

pub fn convert_args(request: &ConvertRequest) -> Result<Vec<String>, AppError> {
    validate_convert_request(request)?;

    let args = match request.media_kind {
        ConvertMediaKind::Video => video_convert_args(request),
        ConvertMediaKind::Audio => audio_convert_args(request),
        ConvertMediaKind::Image => image_convert_args(request),
    };

    Ok(args.into_vec())
}

pub fn validate_convert_request(request: &ConvertRequest) -> Result<(), AppError> {
    validate_media_path(&request.input_path)?;
    validate_output_path(request)?;

    if request.output_format.media_kind() != request.media_kind {
        return Err(AppError::invalid_input(format!(
            "输出格式 .{} 与当前媒体类型不匹配。",
            request.output_format.extension()
        )));
    }

    if let Some(duration_sec) = request.duration_sec {
        if !duration_sec.is_finite() || duration_sec < 0.0 {
            return Err(AppError::invalid_input("媒体时长无效，无法创建转换任务。"));
        }
    }

    Ok(())
}

fn validate_output_path(request: &ConvertRequest) -> Result<(), AppError> {
    let output_path = request.output_path.trim();
    if output_path.is_empty() {
        return Err(AppError::invalid_input("请选择输出路径。"));
    }

    let output = Path::new(output_path);
    let expected_extension = request.output_format.extension();
    let actual_extension = output
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or_default()
        .to_lowercase();
    if actual_extension != expected_extension {
        return Err(AppError::invalid_input(format!(
            "输出路径扩展名必须是 .{expected_extension}。"
        )));
    }

    if same_path(&request.input_path, output_path) {
        return Err(AppError::invalid_input("输出路径不能与输入文件相同。"));
    }

    let parent = output
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .ok_or_else(|| AppError::invalid_input("输出路径必须包含已存在的父目录。"))?;

    match parent.try_exists() {
        Ok(true) => {}
        Ok(false) => {
            return Err(AppError::invalid_input(format!(
                "输出目录不存在：{}",
                parent.to_string_lossy()
            )));
        }
        Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => {
            return Err(AppError::permission_denied(
                parent.to_string_lossy(),
                error.to_string(),
            ));
        }
        Err(error) => {
            return Err(AppError::invalid_input(format!(
                "无法访问输出目录：{}; {error}",
                parent.to_string_lossy()
            )));
        }
    }

    if output.try_exists().map_err(|error| {
        AppError::invalid_input(format!("无法访问输出路径：{output_path}; {error}"))
    })? && output
        .metadata()
        .map(|metadata| metadata.is_dir())
        .unwrap_or(false)
    {
        return Err(AppError::invalid_input("输出路径不能是文件夹。"));
    }

    Ok(())
}

fn same_path(left: &str, right: &str) -> bool {
    normalize_path(left) == normalize_path(right)
}

fn normalize_path(path: &str) -> String {
    let normalized = path.replace('/', "\\").trim_end_matches('\\').to_string();
    if cfg!(windows) {
        normalized.to_lowercase()
    } else {
        normalized
    }
}

fn base_convert_args(request: &ConvertRequest) -> CommandArgs {
    CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .input_path(&request.input_path)
}

fn video_convert_args(request: &ConvertRequest) -> CommandArgs {
    let builder = base_convert_args(request).args(["-map", "0:v:0", "-map", "0:a?"]);
    let builder = match request.mode {
        ConvertMode::Copy => builder.args(["-c", "copy"]),
        ConvertMode::Auto => video_auto_codec_args(builder, request.output_format),
        ConvertMode::Custom => {
            let builder = video_codec_args(builder, request.video_codec);
            audio_codec_args(builder, request.audio_codec)
        }
    };

    add_faststart_if_needed(builder, request)
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
}

fn audio_convert_args(request: &ConvertRequest) -> CommandArgs {
    let builder = base_convert_args(request).arg("-vn");
    let builder = match request.mode {
        ConvertMode::Copy => builder.args(["-c:a", "copy"]),
        ConvertMode::Auto => audio_auto_codec_args(builder, request.output_format),
        ConvertMode::Custom => audio_codec_args(builder, request.audio_codec),
    };

    builder
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
}

fn image_convert_args(request: &ConvertRequest) -> CommandArgs {
    let builder = base_convert_args(request).args(["-map", "0:v:0", "-frames:v", "1"]);
    let builder = match request.mode {
        ConvertMode::Copy => builder.args(["-c:v", "copy"]),
        ConvertMode::Auto => image_auto_codec_args(builder, request.output_format),
        ConvertMode::Custom => image_auto_codec_args(builder, request.output_format),
    };

    builder
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
}

fn video_auto_codec_args(builder: CommandArgs, output_format: ConvertOutputFormat) -> CommandArgs {
    match output_format {
        ConvertOutputFormat::Webm => builder.args([
            "-c:v",
            "libvpx-vp9",
            "-b:v",
            "0",
            "-crf",
            "32",
            "-c:a",
            "libopus",
            "-b:a",
            "128k",
        ]),
        _ => builder.args([
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a",
            "aac", "-b:a", "192k",
        ]),
    }
}

fn video_codec_args(builder: CommandArgs, codec: ConvertVideoCodec) -> CommandArgs {
    match codec {
        ConvertVideoCodec::Copy => builder.args(["-c:v", "copy"]),
        ConvertVideoCodec::H264 => builder.args([
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
        ]),
        ConvertVideoCodec::H265 => builder.args([
            "-c:v", "libx265", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
        ]),
        ConvertVideoCodec::Vp9 => builder.args(["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32"]),
    }
}

fn audio_auto_codec_args(builder: CommandArgs, output_format: ConvertOutputFormat) -> CommandArgs {
    match output_format {
        ConvertOutputFormat::Mp3 => builder.args(["-c:a", "libmp3lame", "-q:a", "2"]),
        ConvertOutputFormat::Wav => builder.args(["-c:a", "pcm_s16le"]),
        ConvertOutputFormat::Flac => builder.args(["-c:a", "flac"]),
        ConvertOutputFormat::Aac | ConvertOutputFormat::M4a => {
            builder.args(["-c:a", "aac", "-b:a", "192k"])
        }
        ConvertOutputFormat::Ogg => builder.args(["-c:a", "libvorbis", "-q:a", "5"]),
        ConvertOutputFormat::Opus => builder.args(["-c:a", "libopus", "-b:a", "128k"]),
        _ => builder,
    }
}

fn audio_codec_args(builder: CommandArgs, codec: ConvertAudioCodec) -> CommandArgs {
    match codec {
        ConvertAudioCodec::Copy => builder.args(["-c:a", "copy"]),
        ConvertAudioCodec::Aac => builder.args(["-c:a", "aac", "-b:a", "192k"]),
        ConvertAudioCodec::Mp3 => builder.args(["-c:a", "libmp3lame", "-q:a", "2"]),
        ConvertAudioCodec::Flac => builder.args(["-c:a", "flac"]),
        ConvertAudioCodec::Opus => builder.args(["-c:a", "libopus", "-b:a", "128k"]),
        ConvertAudioCodec::Vorbis => builder.args(["-c:a", "libvorbis", "-q:a", "5"]),
        ConvertAudioCodec::PcmS16le => builder.args(["-c:a", "pcm_s16le"]),
    }
}

fn image_auto_codec_args(builder: CommandArgs, output_format: ConvertOutputFormat) -> CommandArgs {
    match output_format {
        ConvertOutputFormat::Png => builder.args(["-c:v", "png"]),
        ConvertOutputFormat::Jpg => builder.args(["-c:v", "mjpeg", "-q:v", "2"]),
        ConvertOutputFormat::Webp => builder.args(["-c:v", "libwebp", "-quality", "85"]),
        ConvertOutputFormat::Bmp => builder.args(["-c:v", "bmp"]),
        ConvertOutputFormat::Tiff => builder.args(["-c:v", "tiff"]),
        _ => builder,
    }
}

fn add_faststart_if_needed(builder: CommandArgs, request: &ConvertRequest) -> CommandArgs {
    if request.mode != ConvertMode::Copy
        && matches!(
            request.output_format,
            ConvertOutputFormat::Mp4 | ConvertOutputFormat::Mov
        )
    {
        builder.args(["-movflags", "+faststart"])
    } else {
        builder
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, path::PathBuf};

    #[test]
    fn keeps_paths_as_single_args() {
        let args = CommandArgs::new()
            .input_path(r"D:\Media Input\中文 sample.mp4")
            .args(["-f", "mp4"])
            .arg(r"D:\Media Output\结果 sample.mp4")
            .into_vec();

        assert_eq!(
            args,
            vec![
                "-i",
                r"D:\Media Input\中文 sample.mp4",
                "-f",
                "mp4",
                r"D:\Media Output\结果 sample.mp4"
            ]
        );
    }

    #[test]
    fn builds_version_args_without_shell_string() {
        assert_eq!(version_args(), vec!["-version"]);
    }

    #[test]
    fn builds_probe_args_with_path_as_single_arg() {
        let args = probe_args(r"D:\媒体 Tests\sample demo 中文.mp4");

        assert_eq!(
            args,
            vec![
                "-v",
                "error",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                r"D:\媒体 Tests\sample demo 中文.mp4"
            ]
        );
    }

    #[test]
    fn builds_null_output_args_with_path_as_single_arg() {
        let args = null_output_args(r"D:\媒体 Tests\sample demo 中文.mp4");

        assert_eq!(
            args,
            vec![
                "-hide_banner",
                "-nostdin",
                "-re",
                "-i",
                r"D:\媒体 Tests\sample demo 中文.mp4",
                "-map",
                "0:v?",
                "-map",
                "0:a?",
                "-f",
                "null",
                "-progress",
                "pipe:1",
                "-nostats",
                "NUL",
            ]
        );
    }

    #[test]
    fn builds_video_auto_mp4_convert_args() {
        let request = sample_request(ConvertMediaKind::Video, ConvertOutputFormat::Mp4, "mp4");

        let args = convert_args(&request).expect("video args should build");

        assert_eq!(
            args[0..5],
            ["-hide_banner", "-nostdin", "-n", "-i", &request.input_path]
        );
        assert!(contains_pair(&args, "-c:v", "libx264"));
        assert!(contains_pair(&args, "-c:a", "aac"));
        assert!(contains_pair(&args, "-movflags", "+faststart"));
        assert!(contains_pair(&args, "-progress", "pipe:1"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_video_copy_webm_convert_args() {
        let request = ConvertRequest {
            output_format: ConvertOutputFormat::Webm,
            mode: ConvertMode::Copy,
            output_path: temp_output_path("video-copy", "converted 中文 sample.webm"),
            ..sample_request(ConvertMediaKind::Video, ConvertOutputFormat::Mp4, "mp4")
        };

        let args = convert_args(&request).expect("copy args should build");

        assert!(contains_pair(&args, "-c", "copy"));
        assert!(!contains_pair(&args, "-movflags", "+faststart"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_audio_auto_opus_convert_args() {
        let request = sample_request(ConvertMediaKind::Audio, ConvertOutputFormat::Opus, "opus");

        let args = convert_args(&request).expect("audio args should build");

        assert!(args.contains(&"-vn".to_string()));
        assert!(contains_pair(&args, "-c:a", "libopus"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_image_auto_webp_convert_args() {
        let request = sample_request(ConvertMediaKind::Image, ConvertOutputFormat::Webp, "webp");

        let args = convert_args(&request).expect("image args should build");

        assert!(contains_pair(&args, "-frames:v", "1"));
        assert!(contains_pair(&args, "-c:v", "libwebp"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn rejects_cross_kind_output_formats() {
        let request = ConvertRequest {
            output_format: ConvertOutputFormat::Mp3,
            output_path: temp_output_path("cross-kind", "converted.mp3"),
            ..sample_request(ConvertMediaKind::Video, ConvertOutputFormat::Mp4, "mp4")
        };

        assert!(convert_args(&request).is_err());
    }

    #[test]
    fn rejects_missing_output_parent() {
        let request = ConvertRequest {
            output_path: temp_missing_parent_output("missing-parent", "converted.mp4"),
            ..sample_request(ConvertMediaKind::Video, ConvertOutputFormat::Mp4, "mp4")
        };

        assert!(convert_args(&request).is_err());
    }

    #[test]
    fn rejects_same_input_and_output_path() {
        let mut request = sample_request(ConvertMediaKind::Video, ConvertOutputFormat::Mp4, "mp4");
        request.output_path = request.input_path.clone();

        assert!(convert_args(&request).is_err());
    }

    #[test]
    fn keeps_convert_paths_as_single_args() {
        let request = sample_request(ConvertMediaKind::Audio, ConvertOutputFormat::Flac, "flac");
        let args = convert_args(&request).expect("path-safe args should build");

        assert!(args.iter().any(|arg| arg == &request.input_path));
        assert!(args.iter().any(|arg| arg == &request.output_path));
    }

    fn sample_request(
        media_kind: ConvertMediaKind,
        output_format: ConvertOutputFormat,
        extension: &str,
    ) -> ConvertRequest {
        let input_path = temp_input_path("input", "sample demo 中文.mp4");
        ConvertRequest {
            input_path,
            output_path: temp_output_path("output", &format!("converted sample 中文.{extension}")),
            media_kind,
            output_format,
            mode: ConvertMode::Auto,
            video_codec: ConvertVideoCodec::H264,
            audio_codec: ConvertAudioCodec::Aac,
            overwrite: false,
            duration_sec: Some(1.5),
        }
    }

    fn temp_input_path(folder: &str, file_name: &str) -> String {
        let path = temp_dir(folder).join(file_name);
        fs::write(&path, b"test media path placeholder").expect("input fixture should be writable");
        path.to_string_lossy().into_owned()
    }

    fn temp_output_path(folder: &str, file_name: &str) -> String {
        temp_dir(folder)
            .join(file_name)
            .to_string_lossy()
            .into_owned()
    }

    fn temp_missing_parent_output(folder: &str, file_name: &str) -> String {
        std::env::temp_dir()
            .join(format!("ffmpeg-gui-stage6-tests-{}", std::process::id()))
            .join(folder)
            .join("missing")
            .join(file_name)
            .to_string_lossy()
            .into_owned()
    }

    fn temp_dir(folder: &str) -> PathBuf {
        let path = std::env::temp_dir()
            .join(format!("ffmpeg-gui-stage6-tests-{}", std::process::id()))
            .join(folder);
        fs::create_dir_all(&path).expect("temp test directory should be writable");
        path
    }

    fn contains_pair(args: &[String], key: &str, value: &str) -> bool {
        args.windows(2)
            .any(|pair| pair[0].as_str() == key && pair[1].as_str() == value)
    }
}
