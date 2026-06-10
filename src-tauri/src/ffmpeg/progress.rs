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
}
