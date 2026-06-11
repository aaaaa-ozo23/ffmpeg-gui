#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProgressLine {
    pub key: String,
    pub value: String,
}

pub fn parse_progress_line(line: &str) -> Option<ProgressLine> {
    let (key, value) = line.trim().split_once('=')?;
    if key.is_empty() {
        return None;
    }

    Some(ProgressLine {
        key: key.to_string(),
        value: value.to_string(),
    })
}

pub fn parse_out_time_ms(line: &str) -> Option<u64> {
    let parsed = parse_progress_line(line)?;
    if parsed.key != "out_time_ms" {
        return None;
    }

    parsed.value.parse::<u64>().ok()
}

pub fn progress_percent(out_time_us: u64, duration_sec: Option<f64>) -> Option<u8> {
    let duration_sec = duration_sec?;
    if !duration_sec.is_finite() || duration_sec <= 0.0 {
        return None;
    }

    let duration_us = duration_sec * 1_000_000.0;
    let percent = ((out_time_us as f64 / duration_us) * 100.0).floor();

    Some(percent.clamp(0.0, 99.0) as u8)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_key_value_progress_lines() {
        assert_eq!(
            parse_progress_line("out_time_ms=1250000"),
            Some(ProgressLine {
                key: "out_time_ms".to_string(),
                value: "1250000".to_string()
            })
        );
    }

    #[test]
    fn parses_out_time_ms() {
        assert_eq!(parse_out_time_ms("out_time_ms=1250000"), Some(1_250_000));
        assert_eq!(parse_out_time_ms("progress=continue"), None);
    }

    #[test]
    fn calculates_progress_percent_with_clamp() {
        assert_eq!(progress_percent(1_250_000, Some(5.0)), Some(25));
        assert_eq!(progress_percent(6_000_000, Some(5.0)), Some(99));
        assert_eq!(progress_percent(1_000_000, None), None);
        assert_eq!(progress_percent(1_000_000, Some(0.0)), None);
    }
}
