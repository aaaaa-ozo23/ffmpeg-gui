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

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrimRequest {
    pub input_path: String,
    pub output_path: String,
    pub media_kind: TrimMediaKind,
    pub output_format: ConvertOutputFormat,
    pub mode: TrimMode,
    pub start_sec: f64,
    pub end_sec: f64,
    pub overwrite: bool,
    pub source_duration_sec: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenshotRequest {
    pub input_path: String,
    pub output_path: String,
    pub output_format: ScreenshotOutputFormat,
    pub timestamp_sec: f64,
    pub overwrite: bool,
    pub source_duration_sec: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioExtractRequest {
    pub input_path: String,
    pub output_path: String,
    pub output_format: AudioExtractOutputFormat,
    pub overwrite: bool,
    pub duration_sec: Option<f64>,
    pub source_audio_stream_count: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleRequest {
    pub input_path: String,
    pub subtitle_path: String,
    pub output_path: String,
    pub mode: SubtitleMode,
    pub output_format: SubtitleOutputFormat,
    pub input_format: SubtitleInputFormat,
    pub encoding: SubtitleEncoding,
    pub fonts_dir: Option<String>,
    pub overwrite: bool,
    pub duration_sec: Option<f64>,
    pub source_video_stream_count: Option<u32>,
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
pub enum TrimMediaKind {
    Video,
    Audio,
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
pub enum TrimMode {
    Copy,
    Accurate,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScreenshotOutputFormat {
    Png,
    Jpg,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AudioExtractOutputFormat {
    Mp3,
    Aac,
    Wav,
    Flac,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SubtitleMode {
    Embed,
    Burn,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SubtitleOutputFormat {
    Mp4,
    Mkv,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SubtitleInputFormat {
    Srt,
    Ass,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SubtitleEncoding {
    Auto,
    Utf8,
    Gbk,
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

impl ScreenshotOutputFormat {
    pub fn extension(self) -> &'static str {
        match self {
            Self::Png => "png",
            Self::Jpg => "jpg",
        }
    }
}

impl AudioExtractOutputFormat {
    pub fn extension(self) -> &'static str {
        match self {
            Self::Mp3 => "mp3",
            Self::Aac => "aac",
            Self::Wav => "wav",
            Self::Flac => "flac",
        }
    }
}

impl SubtitleOutputFormat {
    pub fn extension(self) -> &'static str {
        match self {
            Self::Mp4 => "mp4",
            Self::Mkv => "mkv",
        }
    }

    fn convert_output_format(self) -> ConvertOutputFormat {
        match self {
            Self::Mp4 => ConvertOutputFormat::Mp4,
            Self::Mkv => ConvertOutputFormat::Mkv,
        }
    }
}

impl SubtitleInputFormat {
    pub fn extension(self) -> &'static str {
        match self {
            Self::Srt => "srt",
            Self::Ass => "ass",
        }
    }
}

impl SubtitleEncoding {
    fn ffmpeg_charenc(self) -> Option<&'static str> {
        match self {
            Self::Auto => None,
            Self::Utf8 => Some("UTF-8"),
            Self::Gbk => Some("GBK"),
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

pub fn trim_args(request: &TrimRequest) -> Result<Vec<String>, AppError> {
    validate_trim_request(request)?;

    let args = match request.mode {
        TrimMode::Copy => trim_copy_args(request),
        TrimMode::Accurate => trim_accurate_args(request),
    };

    Ok(args.into_vec())
}

pub fn screenshot_args(request: &ScreenshotRequest) -> Result<Vec<String>, AppError> {
    validate_screenshot_request(request)?;

    let builder = CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .args(["-ss", &format_seconds(request.timestamp_sec)])
        .input_path(&request.input_path)
        .args(["-map", "0:v:0", "-frames:v", "1", "-an", "-sn"]);

    let builder = match request.output_format {
        ScreenshotOutputFormat::Png => builder.args(["-c:v", "png"]),
        ScreenshotOutputFormat::Jpg => builder.args(["-c:v", "mjpeg", "-q:v", "2"]),
    };

    Ok(builder
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
        .into_vec())
}

pub fn audio_extract_args(request: &AudioExtractRequest) -> Result<Vec<String>, AppError> {
    validate_audio_extract_request(request)?;

    let builder = CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .input_path(&request.input_path)
        .args(["-map", "0:a:0", "-vn", "-sn"]);
    let builder = match request.output_format {
        AudioExtractOutputFormat::Mp3 => builder.args(["-c:a", "libmp3lame", "-q:a", "2"]),
        AudioExtractOutputFormat::Aac => builder.args(["-c:a", "aac", "-b:a", "192k"]),
        AudioExtractOutputFormat::Wav => builder.args(["-c:a", "pcm_s16le"]),
        AudioExtractOutputFormat::Flac => builder.args(["-c:a", "flac"]),
    };

    Ok(builder
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
        .into_vec())
}

pub fn subtitle_args(request: &SubtitleRequest) -> Result<Vec<String>, AppError> {
    validate_subtitle_request(request)?;

    let args = match request.mode {
        SubtitleMode::Embed => subtitle_embed_args(request),
        SubtitleMode::Burn => subtitle_burn_args(request),
    };

    Ok(args.into_vec())
}

pub fn validate_convert_request(request: &ConvertRequest) -> Result<(), AppError> {
    validate_media_path(&request.input_path)?;
    validate_output_path(
        &request.input_path,
        &request.output_path,
        request.output_format.extension(),
    )?;

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

pub fn validate_trim_request(request: &TrimRequest) -> Result<(), AppError> {
    validate_media_path(&request.input_path)?;
    validate_output_path(
        &request.input_path,
        &request.output_path,
        request.output_format.extension(),
    )?;

    if trim_output_media_kind(request.output_format) != Some(request.media_kind) {
        return Err(AppError::invalid_input(format!(
            "输出格式 .{} 与当前截取媒体类型不匹配。",
            request.output_format.extension()
        )));
    }

    if !request.start_sec.is_finite() || !request.end_sec.is_finite() {
        return Err(AppError::invalid_input("截取时间必须是有效数字。"));
    }

    if request.start_sec < 0.0 {
        return Err(AppError::invalid_input("开始时间不能小于 0。"));
    }

    if request.end_sec <= request.start_sec {
        return Err(AppError::invalid_input("结束时间必须大于开始时间。"));
    }

    if let Some(source_duration_sec) = request.source_duration_sec {
        if !source_duration_sec.is_finite() || source_duration_sec <= 0.0 {
            return Err(AppError::invalid_input("媒体时长无效，无法创建截取任务。"));
        }

        if request.end_sec > source_duration_sec + 0.001 {
            return Err(AppError::invalid_input("结束时间不能超过媒体总时长。"));
        }
    }

    Ok(())
}

pub fn validate_screenshot_request(request: &ScreenshotRequest) -> Result<(), AppError> {
    validate_media_path(&request.input_path)?;
    validate_output_path(
        &request.input_path,
        &request.output_path,
        request.output_format.extension(),
    )?;

    if !request.timestamp_sec.is_finite() || request.timestamp_sec < 0.0 {
        return Err(AppError::invalid_input("截图时间点必须是不小于 0 的秒数。"));
    }

    if let Some(duration_sec) = request.source_duration_sec {
        if !duration_sec.is_finite() || duration_sec < 0.0 {
            return Err(AppError::invalid_input("媒体时长无效，无法创建截图任务。"));
        }

        if request.timestamp_sec > duration_sec + 0.001 {
            return Err(AppError::invalid_input("截图时间点不能超过媒体时长。"));
        }
    }

    Ok(())
}

pub fn validate_audio_extract_request(request: &AudioExtractRequest) -> Result<(), AppError> {
    validate_media_path(&request.input_path)?;
    validate_output_path(
        &request.input_path,
        &request.output_path,
        request.output_format.extension(),
    )?;

    if let Some(duration_sec) = request.duration_sec {
        if !duration_sec.is_finite() || duration_sec < 0.0 {
            return Err(AppError::invalid_input(
                "媒体时长无效，无法创建音频提取任务。",
            ));
        }
    }

    if matches!(request.source_audio_stream_count, Some(0)) {
        return Err(AppError::invalid_input("当前视频没有可提取的音频流。"));
    }

    Ok(())
}

pub fn validate_subtitle_request(request: &SubtitleRequest) -> Result<(), AppError> {
    validate_media_path(&request.input_path)?;
    validate_media_path(&request.subtitle_path)?;
    validate_output_path(
        &request.input_path,
        &request.output_path,
        request.output_format.extension(),
    )?;

    let subtitle_extension = Path::new(&request.subtitle_path)
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or_default()
        .to_lowercase();
    if subtitle_extension != request.input_format.extension() {
        return Err(AppError::invalid_input(format!(
            "字幕文件扩展名必须是 .{}。",
            request.input_format.extension()
        )));
    }

    if same_path(&request.subtitle_path, &request.output_path) {
        return Err(AppError::invalid_input("输出路径不能与字幕文件相同。"));
    }

    if let Some(duration_sec) = request.duration_sec {
        if !duration_sec.is_finite() || duration_sec < 0.0 {
            return Err(AppError::invalid_input("媒体时长无效，无法创建字幕任务。"));
        }
    }

    if matches!(request.source_video_stream_count, Some(0)) {
        return Err(AppError::invalid_input("字幕任务只支持包含视频流的媒体。"));
    }

    if let Some(fonts_dir) = request.fonts_dir.as_deref().map(str::trim) {
        if !fonts_dir.is_empty() {
            let path = Path::new(fonts_dir);
            match path.try_exists() {
                Ok(true) if path.is_dir() => {}
                Ok(true) => {
                    return Err(AppError::invalid_input("字体路径必须是文件夹。"));
                }
                Ok(false) => {
                    return Err(AppError::invalid_input(format!(
                        "字体目录不存在：{fonts_dir}"
                    )));
                }
                Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => {
                    return Err(AppError::permission_denied(fonts_dir, error.to_string()));
                }
                Err(error) => {
                    return Err(AppError::invalid_input(format!(
                        "无法访问字体目录：{fonts_dir}; {error}"
                    )));
                }
            }
        }
    }

    Ok(())
}

fn validate_output_path(
    input_path: &str,
    output_path: &str,
    expected_extension: &str,
) -> Result<(), AppError> {
    let output_path = output_path.trim();
    if output_path.is_empty() {
        return Err(AppError::invalid_input("请选择输出路径。"));
    }

    let output = Path::new(output_path);
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

    if same_path(input_path, output_path) {
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

fn format_seconds(seconds: f64) -> String {
    format!("{seconds:.3}")
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

fn trim_copy_args(request: &TrimRequest) -> CommandArgs {
    let builder = CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .arg("-ss")
        .arg(format_seconds(request.start_sec))
        .input_path(&request.input_path)
        .arg("-t")
        .arg(format_seconds(trim_duration_sec(request)));

    trim_stream_map_args(builder, request.media_kind)
        .args(["-c", "copy", "-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
}

fn trim_accurate_args(request: &TrimRequest) -> CommandArgs {
    let builder = CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .input_path(&request.input_path)
        .arg("-ss")
        .arg(format_seconds(request.start_sec))
        .arg("-t")
        .arg(format_seconds(trim_duration_sec(request)));

    let builder = match request.media_kind {
        TrimMediaKind::Video => {
            let builder = trim_stream_map_args(builder, request.media_kind);
            video_auto_codec_args(builder, request.output_format)
        }
        TrimMediaKind::Audio => {
            let builder = trim_stream_map_args(builder, request.media_kind);
            audio_auto_codec_args(builder, request.output_format)
        }
    };

    add_faststart_for_format(builder, request.output_format, false)
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
}

fn trim_stream_map_args(builder: CommandArgs, media_kind: TrimMediaKind) -> CommandArgs {
    match media_kind {
        TrimMediaKind::Video => builder.args(["-map", "0:v:0", "-map", "0:a?", "-sn"]),
        TrimMediaKind::Audio => builder.args(["-vn", "-map", "0:a:0"]),
    }
}

fn trim_duration_sec(request: &TrimRequest) -> f64 {
    request.end_sec - request.start_sec
}

fn trim_output_media_kind(output_format: ConvertOutputFormat) -> Option<TrimMediaKind> {
    match output_format {
        ConvertOutputFormat::Mp4
        | ConvertOutputFormat::Mkv
        | ConvertOutputFormat::Mov
        | ConvertOutputFormat::Webm => Some(TrimMediaKind::Video),
        ConvertOutputFormat::Mp3
        | ConvertOutputFormat::Wav
        | ConvertOutputFormat::Flac
        | ConvertOutputFormat::Aac
        | ConvertOutputFormat::M4a
        | ConvertOutputFormat::Ogg
        | ConvertOutputFormat::Opus => Some(TrimMediaKind::Audio),
        _ => None,
    }
}

fn subtitle_embed_args(request: &SubtitleRequest) -> CommandArgs {
    let builder = CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .input_path(&request.input_path);
    let builder = if let Some(charenc) = request.encoding.ffmpeg_charenc() {
        builder.args(["-sub_charenc", charenc])
    } else {
        builder
    };
    let builder = builder
        .input_path(&request.subtitle_path)
        .args(["-map", "0:v:0", "-map", "0:a?", "-map", "1:0"])
        .args(["-c:v", "copy", "-c:a", "copy"])
        .args(["-c:s", subtitle_embed_codec(request)])
        .args(["-progress", "pipe:1", "-nostats"]);

    add_movflags_for_subtitle_embed(builder, request.output_format).arg(&request.output_path)
}

fn subtitle_burn_args(request: &SubtitleRequest) -> CommandArgs {
    let output_format = request.output_format.convert_output_format();
    let builder = CommandArgs::new()
        .args(["-hide_banner", "-nostdin"])
        .arg(if request.overwrite { "-y" } else { "-n" })
        .input_path(&request.input_path)
        .args(["-map", "0:v:0", "-map", "0:a?", "-sn"])
        .arg("-vf")
        .arg(subtitle_filter(request));
    let builder = video_auto_codec_args(builder, output_format);

    add_faststart_for_format(builder, output_format, false)
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&request.output_path)
}

fn subtitle_embed_codec(request: &SubtitleRequest) -> &'static str {
    match request.output_format {
        SubtitleOutputFormat::Mp4 => "mov_text",
        SubtitleOutputFormat::Mkv => match request.input_format {
            SubtitleInputFormat::Srt => "srt",
            SubtitleInputFormat::Ass => "ass",
        },
    }
}

fn add_movflags_for_subtitle_embed(
    builder: CommandArgs,
    output_format: SubtitleOutputFormat,
) -> CommandArgs {
    if output_format == SubtitleOutputFormat::Mp4 {
        builder.args(["-movflags", "+faststart"])
    } else {
        builder
    }
}

fn subtitle_filter(request: &SubtitleRequest) -> String {
    let mut filter = format!(
        "subtitles='{}'",
        escape_subtitle_filter_path(&request.subtitle_path)
    );

    if let Some(charenc) = request.encoding.ffmpeg_charenc() {
        filter.push_str(":charenc=");
        filter.push_str(charenc);
    }

    if let Some(fonts_dir) = request.fonts_dir.as_deref().map(str::trim) {
        if !fonts_dir.is_empty() {
            filter.push_str(":fontsdir='");
            filter.push_str(&escape_subtitle_filter_path(fonts_dir));
            filter.push('\'');
        }
    }

    filter
}

fn escape_subtitle_filter_path(path: &str) -> String {
    path.replace('\\', "/")
        .replace(':', "\\:")
        .replace('\'', "\\'")
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
    add_faststart_for_format(
        builder,
        request.output_format,
        request.mode == ConvertMode::Copy,
    )
}

fn add_faststart_for_format(
    builder: CommandArgs,
    output_format: ConvertOutputFormat,
    is_copy_mode: bool,
) -> CommandArgs {
    if !is_copy_mode
        && matches!(
            output_format,
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

    #[test]
    fn builds_video_copy_trim_args_with_seek_before_input() {
        let request = sample_trim_request(
            TrimMediaKind::Video,
            ConvertOutputFormat::Mkv,
            TrimMode::Copy,
            "mkv",
        );

        let args = trim_args(&request).expect("video copy trim args should build");

        assert!(contains_pair(&args, "-ss", "1.250"));
        assert!(contains_pair(&args, "-t", "3.250"));
        assert!(contains_pair(&args, "-c", "copy"));
        assert!(contains_pair(&args, "-progress", "pipe:1"));
        assert!(index_of(&args, "-ss") < index_of(&args, "-i"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_video_accurate_trim_args_with_seek_after_input() {
        let request = sample_trim_request(
            TrimMediaKind::Video,
            ConvertOutputFormat::Mp4,
            TrimMode::Accurate,
            "mp4",
        );

        let args = trim_args(&request).expect("video accurate trim args should build");

        assert!(contains_pair(&args, "-c:v", "libx264"));
        assert!(contains_pair(&args, "-c:a", "aac"));
        assert!(contains_pair(&args, "-movflags", "+faststart"));
        assert!(index_of(&args, "-i") < index_of(&args, "-ss"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_audio_accurate_trim_args() {
        let request = sample_trim_request(
            TrimMediaKind::Audio,
            ConvertOutputFormat::Flac,
            TrimMode::Accurate,
            "flac",
        );

        let args = trim_args(&request).expect("audio trim args should build");

        assert!(args.contains(&"-vn".to_string()));
        assert!(contains_pair(&args, "-map", "0:a:0"));
        assert!(contains_pair(&args, "-c:a", "flac"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn rejects_invalid_trim_ranges() {
        let mut request = sample_trim_request(
            TrimMediaKind::Video,
            ConvertOutputFormat::Mp4,
            TrimMode::Copy,
            "mp4",
        );

        request.end_sec = request.start_sec;
        assert!(trim_args(&request).is_err());

        request.end_sec = 4.5;
        request.start_sec = -1.0;
        assert!(trim_args(&request).is_err());

        request.start_sec = 1.0;
        request.end_sec = 99.0;
        assert!(trim_args(&request).is_err());
    }

    #[test]
    fn rejects_trim_output_format_mismatches() {
        let request = TrimRequest {
            output_format: ConvertOutputFormat::Mp3,
            output_path: temp_output_path("trim-cross-kind", "trimmed.mp3"),
            ..sample_trim_request(
                TrimMediaKind::Video,
                ConvertOutputFormat::Mp4,
                TrimMode::Copy,
                "mp4",
            )
        };

        assert!(trim_args(&request).is_err());
    }

    #[test]
    fn rejects_trim_output_extension_mismatch() {
        let request = TrimRequest {
            output_path: temp_output_path("trim-extension", "trimmed.mkv"),
            ..sample_trim_request(
                TrimMediaKind::Video,
                ConvertOutputFormat::Mp4,
                TrimMode::Copy,
                "mp4",
            )
        };

        assert!(trim_args(&request).is_err());
    }

    #[test]
    fn rejects_same_trim_input_and_output_path() {
        let mut request = sample_trim_request(
            TrimMediaKind::Audio,
            ConvertOutputFormat::Mp3,
            TrimMode::Copy,
            "mp3",
        );
        request.output_path = request.input_path.clone();

        assert!(trim_args(&request).is_err());
    }

    #[test]
    fn keeps_trim_paths_as_single_args() {
        let request = sample_trim_request(
            TrimMediaKind::Audio,
            ConvertOutputFormat::Aac,
            TrimMode::Copy,
            "aac",
        );
        let args = trim_args(&request).expect("path-safe trim args should build");

        assert!(args.iter().any(|arg| arg == &request.input_path));
        assert!(args.iter().any(|arg| arg == &request.output_path));
    }

    #[test]
    fn builds_png_screenshot_args() {
        let request = sample_screenshot_request(ScreenshotOutputFormat::Png, "png");

        let args = screenshot_args(&request).expect("png screenshot args should build");

        assert_eq!(
            args[0..7],
            [
                "-hide_banner",
                "-nostdin",
                "-n",
                "-ss",
                "1.250",
                "-i",
                &request.input_path
            ]
        );
        assert!(contains_pair(&args, "-map", "0:v:0"));
        assert!(contains_pair(&args, "-frames:v", "1"));
        assert!(args.contains(&"-an".to_string()));
        assert!(args.contains(&"-sn".to_string()));
        assert!(contains_pair(&args, "-c:v", "png"));
        assert!(contains_pair(&args, "-progress", "pipe:1"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_jpg_screenshot_args() {
        let request = sample_screenshot_request(ScreenshotOutputFormat::Jpg, "jpg");

        let args = screenshot_args(&request).expect("jpg screenshot args should build");

        assert!(contains_pair(&args, "-c:v", "mjpeg"));
        assert!(contains_pair(&args, "-q:v", "2"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn keeps_screenshot_paths_as_single_args() {
        let request = ScreenshotRequest {
            input_path: temp_input_path("screenshot input", "中文 sample video.mp4"),
            output_path: temp_output_path("screenshot output", "截图 sample output.png"),
            output_format: ScreenshotOutputFormat::Png,
            timestamp_sec: 0.5,
            overwrite: true,
            source_duration_sec: Some(5.0),
        };

        let args = screenshot_args(&request).expect("path-safe screenshot args should build");

        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.input_path)
                .count(),
            1
        );
        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.output_path)
                .count(),
            1
        );
    }

    #[test]
    fn rejects_negative_screenshot_timestamp() {
        let request = ScreenshotRequest {
            timestamp_sec: -0.1,
            ..sample_screenshot_request(ScreenshotOutputFormat::Png, "png")
        };

        assert!(screenshot_args(&request).is_err());
    }

    #[test]
    fn rejects_screenshot_timestamp_beyond_known_duration() {
        let request = ScreenshotRequest {
            timestamp_sec: 3.1,
            source_duration_sec: Some(3.0),
            ..sample_screenshot_request(ScreenshotOutputFormat::Png, "png")
        };

        assert!(screenshot_args(&request).is_err());
    }

    #[test]
    fn rejects_screenshot_output_extension_mismatch() {
        let request = ScreenshotRequest {
            output_path: temp_output_path("screenshot-extension", "frame.jpg"),
            output_format: ScreenshotOutputFormat::Png,
            ..sample_screenshot_request(ScreenshotOutputFormat::Png, "png")
        };

        assert!(screenshot_args(&request).is_err());
    }

    #[test]
    fn rejects_screenshot_missing_output_parent() {
        let request = ScreenshotRequest {
            output_path: temp_missing_parent_output("screenshot-missing-parent", "frame.png"),
            ..sample_screenshot_request(ScreenshotOutputFormat::Png, "png")
        };

        assert!(screenshot_args(&request).is_err());
    }

    #[test]
    fn rejects_screenshot_same_input_and_output_path() {
        let input_path = temp_input_path("screenshot-same-path", "frame.png");
        let request = ScreenshotRequest {
            input_path: input_path.clone(),
            output_path: input_path,
            output_format: ScreenshotOutputFormat::Png,
            timestamp_sec: 0.0,
            overwrite: false,
            source_duration_sec: Some(1.0),
        };

        assert!(screenshot_args(&request).is_err());
    }

    #[test]
    fn builds_mp3_audio_extract_args() {
        let request = sample_audio_extract_request(AudioExtractOutputFormat::Mp3, "mp3");

        let args = audio_extract_args(&request).expect("mp3 extract args should build");

        assert_eq!(
            args[0..5],
            ["-hide_banner", "-nostdin", "-n", "-i", &request.input_path]
        );
        assert!(contains_pair(&args, "-map", "0:a:0"));
        assert!(args.contains(&"-vn".to_string()));
        assert!(args.contains(&"-sn".to_string()));
        assert!(contains_pair(&args, "-c:a", "libmp3lame"));
        assert!(contains_pair(&args, "-q:a", "2"));
        assert!(contains_pair(&args, "-progress", "pipe:1"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_aac_wav_and_flac_audio_extract_args() {
        let aac = audio_extract_args(&sample_audio_extract_request(
            AudioExtractOutputFormat::Aac,
            "aac",
        ))
        .expect("aac extract args should build");
        let wav = audio_extract_args(&sample_audio_extract_request(
            AudioExtractOutputFormat::Wav,
            "wav",
        ))
        .expect("wav extract args should build");
        let flac = audio_extract_args(&sample_audio_extract_request(
            AudioExtractOutputFormat::Flac,
            "flac",
        ))
        .expect("flac extract args should build");

        assert!(contains_pair(&aac, "-c:a", "aac"));
        assert!(contains_pair(&aac, "-b:a", "192k"));
        assert!(contains_pair(&wav, "-c:a", "pcm_s16le"));
        assert!(contains_pair(&flac, "-c:a", "flac"));
    }

    #[test]
    fn keeps_audio_extract_paths_as_single_args() {
        let request = AudioExtractRequest {
            input_path: temp_input_path("audio input path", "视频 sample 中文.mp4"),
            output_path: temp_output_path("audio output path", "音频 output sample.flac"),
            output_format: AudioExtractOutputFormat::Flac,
            overwrite: true,
            duration_sec: Some(5.0),
            source_audio_stream_count: Some(1),
        };

        let args = audio_extract_args(&request).expect("path-safe extract args should build");

        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.input_path)
                .count(),
            1
        );
        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.output_path)
                .count(),
            1
        );
    }

    #[test]
    fn rejects_audio_extract_when_source_has_no_audio_streams() {
        let request = AudioExtractRequest {
            source_audio_stream_count: Some(0),
            ..sample_audio_extract_request(AudioExtractOutputFormat::Mp3, "mp3")
        };

        assert!(audio_extract_args(&request).is_err());
    }

    #[test]
    fn rejects_audio_extract_output_extension_mismatch() {
        let request = AudioExtractRequest {
            output_path: temp_output_path("audio-extension", "extracted.wav"),
            output_format: AudioExtractOutputFormat::Mp3,
            ..sample_audio_extract_request(AudioExtractOutputFormat::Mp3, "mp3")
        };

        assert!(audio_extract_args(&request).is_err());
    }

    #[test]
    fn rejects_audio_extract_missing_output_parent() {
        let request = AudioExtractRequest {
            output_path: temp_missing_parent_output("audio-missing-parent", "extracted.mp3"),
            ..sample_audio_extract_request(AudioExtractOutputFormat::Mp3, "mp3")
        };

        assert!(audio_extract_args(&request).is_err());
    }

    #[test]
    fn rejects_audio_extract_same_input_and_output_path() {
        let input_path = temp_input_path("audio-same-path", "sample.mp3");
        let request = AudioExtractRequest {
            input_path: input_path.clone(),
            output_path: input_path,
            output_format: AudioExtractOutputFormat::Mp3,
            overwrite: false,
            duration_sec: Some(1.0),
            source_audio_stream_count: Some(1),
        };

        assert!(audio_extract_args(&request).is_err());
    }

    #[test]
    fn rejects_audio_extract_invalid_duration() {
        let request = AudioExtractRequest {
            duration_sec: Some(-1.0),
            ..sample_audio_extract_request(AudioExtractOutputFormat::Mp3, "mp3")
        };

        assert!(audio_extract_args(&request).is_err());
    }

    #[test]
    fn builds_srt_to_mkv_subtitle_embed_args() {
        let request = sample_subtitle_request(
            SubtitleMode::Embed,
            SubtitleInputFormat::Srt,
            SubtitleOutputFormat::Mkv,
            "srt",
            "mkv",
        );

        let args = subtitle_args(&request).expect("srt mkv subtitle args should build");

        assert_eq!(
            args[0..5],
            ["-hide_banner", "-nostdin", "-n", "-i", &request.input_path]
        );
        assert!(contains_pair(&args, "-map", "0:v:0"));
        assert!(contains_pair(&args, "-map", "0:a?"));
        assert!(contains_pair(&args, "-map", "1:0"));
        assert!(contains_pair(&args, "-c:v", "copy"));
        assert!(contains_pair(&args, "-c:a", "copy"));
        assert!(contains_pair(&args, "-c:s", "srt"));
        assert!(!contains_pair(&args, "-movflags", "+faststart"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_srt_to_mp4_mov_text_subtitle_embed_args() {
        let request = sample_subtitle_request(
            SubtitleMode::Embed,
            SubtitleInputFormat::Srt,
            SubtitleOutputFormat::Mp4,
            "srt",
            "mp4",
        );

        let args = subtitle_args(&request).expect("srt mp4 subtitle args should build");

        assert!(contains_pair(&args, "-c:s", "mov_text"));
        assert!(contains_pair(&args, "-movflags", "+faststart"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_ass_to_mkv_subtitle_embed_args() {
        let request = sample_subtitle_request(
            SubtitleMode::Embed,
            SubtitleInputFormat::Ass,
            SubtitleOutputFormat::Mkv,
            "ass",
            "mkv",
        );

        let args = subtitle_args(&request).expect("ass mkv subtitle args should build");

        assert!(contains_pair(&args, "-c:s", "ass"));
        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.subtitle_path)
                .count(),
            1
        );
    }

    #[test]
    fn builds_srt_hard_subtitle_burn_args() {
        let request = SubtitleRequest {
            encoding: SubtitleEncoding::Utf8,
            fonts_dir: Some(temp_dir("subtitle-fonts").to_string_lossy().into_owned()),
            ..sample_subtitle_request(
                SubtitleMode::Burn,
                SubtitleInputFormat::Srt,
                SubtitleOutputFormat::Mp4,
                "srt",
                "mp4",
            )
        };

        let args = subtitle_args(&request).expect("srt burn subtitle args should build");

        assert!(contains_pair(&args, "-map", "0:v:0"));
        assert!(contains_pair(&args, "-map", "0:a?"));
        assert!(args.contains(&"-sn".to_string()));
        assert!(args.contains(&"-vf".to_string()));
        assert!(args.iter().any(|arg| {
            arg.starts_with("subtitles='")
                && arg.contains(":charenc=UTF-8")
                && arg.contains(":fontsdir='")
        }));
        assert!(contains_pair(&args, "-c:v", "libx264"));
        assert!(contains_pair(&args, "-c:a", "aac"));
        assert!(contains_pair(&args, "-movflags", "+faststart"));
        assert_eq!(
            args.last().map(String::as_str),
            Some(request.output_path.as_str())
        );
    }

    #[test]
    fn builds_ass_hard_subtitle_burn_args() {
        let request = sample_subtitle_request(
            SubtitleMode::Burn,
            SubtitleInputFormat::Ass,
            SubtitleOutputFormat::Mkv,
            "ass",
            "mkv",
        );

        let args = subtitle_args(&request).expect("ass burn subtitle args should build");

        assert!(contains_pair(&args, "-vf", &subtitle_filter(&request)));
        assert!(contains_pair(&args, "-c:v", "libx264"));
        assert!(contains_pair(&args, "-c:a", "aac"));
        assert!(!contains_pair(&args, "-movflags", "+faststart"));
    }

    #[test]
    fn keeps_subtitle_paths_as_single_args_for_embed() {
        let request = sample_subtitle_request(
            SubtitleMode::Embed,
            SubtitleInputFormat::Srt,
            SubtitleOutputFormat::Mp4,
            "srt",
            "mp4",
        );

        let args = subtitle_args(&request).expect("path-safe subtitle args should build");

        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.input_path)
                .count(),
            1
        );
        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.subtitle_path)
                .count(),
            1
        );
        assert_eq!(
            args.iter()
                .filter(|arg| *arg == &request.output_path)
                .count(),
            1
        );
    }

    #[test]
    fn escapes_subtitle_filter_paths_for_windows() {
        assert_eq!(
            escape_subtitle_filter_path(r"D:\Media Input\字幕 sample's.srt"),
            r"D\:/Media Input/字幕 sample\'s.srt"
        );
    }

    #[test]
    fn rejects_subtitle_output_extension_mismatch() {
        let request = SubtitleRequest {
            output_path: temp_output_path("subtitle-extension", "subtitled.mkv"),
            output_format: SubtitleOutputFormat::Mp4,
            ..sample_subtitle_request(
                SubtitleMode::Embed,
                SubtitleInputFormat::Srt,
                SubtitleOutputFormat::Mp4,
                "srt",
                "mp4",
            )
        };

        assert!(subtitle_args(&request).is_err());
    }

    #[test]
    fn rejects_subtitle_same_output_as_input_or_subtitle_path() {
        let mut input_same = sample_subtitle_request(
            SubtitleMode::Embed,
            SubtitleInputFormat::Srt,
            SubtitleOutputFormat::Mp4,
            "srt",
            "mp4",
        );
        input_same.output_path = input_same.input_path.clone();
        assert!(subtitle_args(&input_same).is_err());

        let mut subtitle_same = sample_subtitle_request(
            SubtitleMode::Embed,
            SubtitleInputFormat::Srt,
            SubtitleOutputFormat::Mp4,
            "srt",
            "mp4",
        );
        subtitle_same.output_path = subtitle_same.subtitle_path.clone();
        assert!(subtitle_args(&subtitle_same).is_err());
    }

    #[test]
    fn rejects_non_video_subtitle_request() {
        let request = SubtitleRequest {
            source_video_stream_count: Some(0),
            ..sample_subtitle_request(
                SubtitleMode::Burn,
                SubtitleInputFormat::Srt,
                SubtitleOutputFormat::Mp4,
                "srt",
                "mp4",
            )
        };

        assert!(subtitle_args(&request).is_err());
    }

    #[test]
    fn rejects_subtitle_input_extension_mismatch() {
        let request = SubtitleRequest {
            subtitle_path: temp_subtitle_path("subtitle-extension-input", "subtitle.ass"),
            input_format: SubtitleInputFormat::Srt,
            ..sample_subtitle_request(
                SubtitleMode::Embed,
                SubtitleInputFormat::Srt,
                SubtitleOutputFormat::Mkv,
                "srt",
                "mkv",
            )
        };

        assert!(subtitle_args(&request).is_err());
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

    fn sample_trim_request(
        media_kind: TrimMediaKind,
        output_format: ConvertOutputFormat,
        mode: TrimMode,
        extension: &str,
    ) -> TrimRequest {
        TrimRequest {
            input_path: temp_input_path("trim-input", "sample demo 中文 space.mp4"),
            output_path: temp_output_path(
                "trim-output",
                &format!("trimmed sample 中文 space.{extension}"),
            ),
            media_kind,
            output_format,
            mode,
            start_sec: 1.25,
            end_sec: 4.5,
            overwrite: false,
            source_duration_sec: Some(10.0),
        }
    }

    fn sample_screenshot_request(
        output_format: ScreenshotOutputFormat,
        extension: &str,
    ) -> ScreenshotRequest {
        ScreenshotRequest {
            input_path: temp_input_path("screenshot-input", "sample demo 中文.mp4"),
            output_path: temp_output_path(
                "screenshot-output",
                &format!("sample demo 中文-screenshot.{extension}"),
            ),
            output_format,
            timestamp_sec: 1.25,
            overwrite: false,
            source_duration_sec: Some(3.0),
        }
    }

    fn sample_audio_extract_request(
        output_format: AudioExtractOutputFormat,
        extension: &str,
    ) -> AudioExtractRequest {
        AudioExtractRequest {
            input_path: temp_input_path("audio-extract-input", "sample demo 中文.mp4"),
            output_path: temp_output_path(
                "audio-extract-output",
                &format!("sample demo 中文-audio.{extension}"),
            ),
            output_format,
            overwrite: false,
            duration_sec: Some(3.0),
            source_audio_stream_count: Some(1),
        }
    }

    fn sample_subtitle_request(
        mode: SubtitleMode,
        input_format: SubtitleInputFormat,
        output_format: SubtitleOutputFormat,
        subtitle_extension: &str,
        output_extension: &str,
    ) -> SubtitleRequest {
        SubtitleRequest {
            input_path: temp_input_path("subtitle-input", "sample demo 中文.mp4"),
            subtitle_path: temp_subtitle_path(
                "subtitle-file",
                &format!("sample subtitle 中文.{subtitle_extension}"),
            ),
            output_path: temp_output_path(
                "subtitle-output",
                &format!("sample demo 中文-subtitled.{output_extension}"),
            ),
            mode,
            output_format,
            input_format,
            encoding: SubtitleEncoding::Auto,
            fonts_dir: None,
            overwrite: false,
            duration_sec: Some(3.0),
            source_video_stream_count: Some(1),
        }
    }

    fn temp_input_path(folder: &str, file_name: &str) -> String {
        let path = temp_dir(folder).join(file_name);
        fs::write(&path, b"test media path placeholder").expect("input fixture should be writable");
        path.to_string_lossy().into_owned()
    }

    fn temp_subtitle_path(folder: &str, file_name: &str) -> String {
        let path = temp_dir(folder).join(file_name);
        fs::write(&path, b"1\n00:00:00,000 --> 00:00:01,000\nsubtitle\n")
            .expect("subtitle fixture should be writable");
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

    fn index_of(args: &[String], key: &str) -> usize {
        args.iter()
            .position(|arg| arg == key)
            .expect("argument should exist")
    }
}
