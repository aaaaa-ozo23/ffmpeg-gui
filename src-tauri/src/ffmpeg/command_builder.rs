use std::path::Path;

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

#[cfg(test)]
mod tests {
    use super::*;

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
}
