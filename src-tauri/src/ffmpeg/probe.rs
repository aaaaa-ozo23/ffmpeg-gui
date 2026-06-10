use std::{collections::HashMap, path::Path};

use serde::{Deserialize, Serialize};

use crate::errors::AppError;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub path: String,
    pub duration_sec: Option<f64>,
    pub size_bytes: Option<u64>,
    pub format_name: Option<String>,
    pub video_streams: Vec<VideoStream>,
    pub audio_streams: Vec<AudioStream>,
    pub subtitle_streams: Vec<SubtitleStream>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoStream {
    pub index: u32,
    pub codec_name: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioStream {
    pub index: u32,
    pub codec_name: String,
    pub sample_rate: Option<u32>,
    pub channels: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleStream {
    pub index: u32,
    pub codec_name: String,
    pub language: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FfprobeOutput {
    #[serde(default)]
    streams: Vec<FfprobeStream>,
    format: Option<FfprobeFormat>,
}

#[derive(Debug, Deserialize)]
struct FfprobeFormat {
    format_name: Option<String>,
    duration: Option<String>,
    size: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FfprobeStream {
    index: Option<u32>,
    codec_name: Option<String>,
    codec_type: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    sample_rate: Option<String>,
    channels: Option<u32>,
    tags: Option<HashMap<String, String>>,
}

pub fn validate_media_path(input_path: &str) -> Result<(), AppError> {
    if input_path.trim().is_empty() {
        return Err(AppError::invalid_input("请选择一个媒体文件。"));
    }

    let path = Path::new(input_path);
    match path.try_exists() {
        Ok(true) => {}
        Ok(false) => return Err(AppError::file_not_found(input_path)),
        Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => {
            return Err(AppError::permission_denied(input_path, error.to_string()));
        }
        Err(error) => {
            return Err(AppError::invalid_input(format!(
                "无法访问媒体路径：{input_path}; {error}"
            )));
        }
    }

    let metadata = path.metadata().map_err(|error| match error.kind() {
        std::io::ErrorKind::PermissionDenied => {
            AppError::permission_denied(input_path, error.to_string())
        }
        _ => AppError::invalid_input(format!("无法读取媒体路径：{input_path}; {error}")),
    })?;

    if metadata.is_dir() {
        return Err(AppError::directory_input(input_path));
    }

    Ok(())
}

pub fn parse_ffprobe_json(input_path: &str, json: &str) -> Result<MediaInfo, AppError> {
    let parsed: FfprobeOutput = serde_json::from_str(json)
        .map_err(|error| AppError::output_parse("FFprobe", error.to_string()))?;

    let format = parsed.format;

    let video_streams = parsed
        .streams
        .iter()
        .filter(|stream| stream.codec_type.as_deref() == Some("video"))
        .map(|stream| VideoStream {
            index: stream.index.unwrap_or_default(),
            codec_name: codec_name_or_unknown(stream),
            width: stream.width,
            height: stream.height,
        })
        .collect();

    let audio_streams = parsed
        .streams
        .iter()
        .filter(|stream| stream.codec_type.as_deref() == Some("audio"))
        .map(|stream| AudioStream {
            index: stream.index.unwrap_or_default(),
            codec_name: codec_name_or_unknown(stream),
            sample_rate: stream
                .sample_rate
                .as_deref()
                .and_then(|sample_rate| sample_rate.parse::<u32>().ok()),
            channels: stream.channels,
        })
        .collect();

    let subtitle_streams = parsed
        .streams
        .iter()
        .filter(|stream| stream.codec_type.as_deref() == Some("subtitle"))
        .map(|stream| SubtitleStream {
            index: stream.index.unwrap_or_default(),
            codec_name: codec_name_or_unknown(stream),
            language: stream
                .tags
                .as_ref()
                .and_then(|tags| tags.get("language").cloned()),
        })
        .collect();

    Ok(MediaInfo {
        path: input_path.to_string(),
        duration_sec: format
            .as_ref()
            .and_then(|format| format.duration.as_deref())
            .and_then(parse_positive_f64),
        size_bytes: format
            .as_ref()
            .and_then(|format| format.size.as_deref())
            .and_then(|size| size.parse::<u64>().ok()),
        format_name: format.and_then(|format| format.format_name),
        video_streams,
        audio_streams,
        subtitle_streams,
    })
}

fn codec_name_or_unknown(stream: &FfprobeStream) -> String {
    stream
        .codec_name
        .as_deref()
        .filter(|codec_name| !codec_name.trim().is_empty())
        .unwrap_or("unknown")
        .to_string()
}

fn parse_positive_f64(value: &str) -> Option<f64> {
    value
        .parse::<f64>()
        .ok()
        .filter(|duration| duration.is_finite() && *duration >= 0.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ErrorCategory;

    const MP4_JSON: &str = r#"{
      "streams": [
        {
          "index": 0,
          "codec_name": "h264",
          "codec_type": "video",
          "width": 128,
          "height": 72
        },
        {
          "index": 1,
          "codec_name": "aac",
          "codec_type": "audio",
          "sample_rate": "44100",
          "channels": 1
        },
        {
          "index": 2,
          "codec_name": "subrip",
          "codec_type": "subtitle",
          "tags": { "language": "eng" }
        }
      ],
      "format": {
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "duration": "1.000000",
        "size": "13609"
      }
    }"#;

    #[test]
    fn parses_mp4_probe_json() {
        let media = parse_ffprobe_json(r"D:\媒体 Tests\sample demo 中文.mp4", MP4_JSON)
            .expect("mp4 json should parse");

        assert_eq!(media.path, r"D:\媒体 Tests\sample demo 中文.mp4");
        assert_eq!(media.duration_sec, Some(1.0));
        assert_eq!(media.size_bytes, Some(13_609));
        assert_eq!(
            media.format_name.as_deref(),
            Some("mov,mp4,m4a,3gp,3g2,mj2")
        );
        assert_eq!(media.video_streams.len(), 1);
        assert_eq!(media.video_streams[0].codec_name, "h264");
        assert_eq!(media.video_streams[0].width, Some(128));
        assert_eq!(media.audio_streams.len(), 1);
        assert_eq!(media.audio_streams[0].sample_rate, Some(44_100));
        assert_eq!(media.subtitle_streams.len(), 1);
        assert_eq!(media.subtitle_streams[0].language.as_deref(), Some("eng"));
    }

    #[test]
    fn parses_audio_only_json() {
        let json = r#"{
          "streams": [
            { "index": 0, "codec_name": "mp3", "codec_type": "audio", "sample_rate": "48000", "channels": 2 }
          ],
          "format": { "format_name": "mp3", "duration": "2.5", "size": "1000" }
        }"#;

        let media = parse_ffprobe_json("audio.mp3", json).expect("audio json should parse");

        assert!(media.video_streams.is_empty());
        assert_eq!(media.audio_streams.len(), 1);
        assert_eq!(media.audio_streams[0].codec_name, "mp3");
        assert_eq!(media.audio_streams[0].channels, Some(2));
    }

    #[test]
    fn parses_still_image_json() {
        let json = r#"{
          "streams": [
            { "index": 0, "codec_name": "png", "codec_type": "video", "width": 320, "height": 180 }
          ],
          "format": { "format_name": "image2", "duration": "N/A", "size": "4096" }
        }"#;

        let media = parse_ffprobe_json(r"D:\媒体 Tests\poster 中文.png", json)
            .expect("image json should parse");

        assert_eq!(media.duration_sec, None);
        assert_eq!(media.size_bytes, Some(4_096));
        assert_eq!(media.video_streams.len(), 1);
        assert_eq!(media.video_streams[0].codec_name, "png");
        assert_eq!(media.video_streams[0].width, Some(320));
        assert!(media.audio_streams.is_empty());
    }

    #[test]
    fn tolerates_missing_or_invalid_numbers() {
        let json = r#"{
          "streams": [
            { "codec_type": "video", "codec_name": "" },
            { "codec_type": "audio", "codec_name": "aac", "sample_rate": "not-a-number" }
          ],
          "format": { "format_name": "wav", "duration": "N/A", "size": "unknown" }
        }"#;

        let media = parse_ffprobe_json("unknown", json).expect("partial json should parse");

        assert_eq!(media.duration_sec, None);
        assert_eq!(media.size_bytes, None);
        assert_eq!(media.video_streams[0].codec_name, "unknown");
        assert_eq!(media.audio_streams[0].sample_rate, None);
    }

    #[test]
    fn rejects_invalid_json() {
        let error = parse_ffprobe_json("broken.mp4", "{").expect_err("invalid json should fail");

        assert_eq!(error.category, ErrorCategory::OutputParse);
    }

    #[test]
    fn rejects_empty_path() {
        let error = validate_media_path("   ").expect_err("empty path should fail");

        assert_eq!(error.category, ErrorCategory::InvalidInput);
    }

    #[test]
    fn rejects_missing_path() {
        let missing = std::env::temp_dir().join(format!(
            "ffmpeg-gui-missing-{}-{}.mp4",
            std::process::id(),
            "stage4"
        ));

        let error =
            validate_media_path(&missing.to_string_lossy()).expect_err("missing path should fail");

        assert_eq!(error.category, ErrorCategory::FileNotFound);
    }

    #[test]
    fn rejects_directory_path() {
        let temp_dir = std::env::temp_dir();

        let error = validate_media_path(&temp_dir.to_string_lossy())
            .expect_err("directory path should fail");

        assert_eq!(error.category, ErrorCategory::DirectoryInput);
    }
}
