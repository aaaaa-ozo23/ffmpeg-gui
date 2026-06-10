import {
  AlertTriangle,
  FileQuestion,
  FileVideo,
  HardDrive,
  LoaderCircle,
  Subtitles,
} from "lucide-react";
import type { MediaProbeState } from "../app/types";

type MediaSummaryPanelProps = {
  mediaState: MediaProbeState;
};

export function MediaSummaryPanel({ mediaState }: MediaSummaryPanelProps) {
  if (mediaState.status === "empty") {
    return (
      <section className="media-summary media-summary-empty">
        <div className="media-summary-header">
          <div className="media-icon" aria-hidden="true">
            <FileQuestion size={22} />
          </div>
          <div>
            <h3>尚未选择媒体</h3>
            <p>支持常见视频、音频和图片；选择后会自动调用 ffprobe 读取文件信息。</p>
          </div>
        </div>
      </section>
    );
  }

  if (mediaState.status === "loading") {
    return (
      <section className="media-summary media-summary-loading">
        <div className="media-summary-header">
          <div className="media-icon" aria-hidden="true">
            <LoaderCircle size={22} />
          </div>
          <div>
            <h3>正在读取媒体信息</h3>
            <p>{mediaState.path}</p>
          </div>
        </div>
      </section>
    );
  }

  if (mediaState.status === "error") {
    return (
      <section className="media-summary media-summary-error">
        <div className="media-summary-header">
          <div className="media-icon" aria-hidden="true">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3>{mediaState.error.message}</h3>
            <p>{mediaState.error.detail ?? mediaState.path ?? "请换一个媒体文件重试。"}</p>
          </div>
        </div>
      </section>
    );
  }

  const { summary: media } = mediaState;

  return (
    <section className="media-summary" aria-labelledby="media-summary-title">
      <div className="media-summary-header">
        <div className="media-icon" aria-hidden="true">
          <FileVideo size={22} />
        </div>
        <div>
          <h3 id="media-summary-title">{media.fileName}</h3>
          <p>{media.path}</p>
        </div>
      </div>

      <dl className="media-grid">
        <div>
          <dt>类型</dt>
          <dd>{media.mediaKind}</dd>
        </div>
        <div>
          <dt>时长</dt>
          <dd>{media.duration}</dd>
        </div>
        <div>
          <dt>容器</dt>
          <dd>{media.container}</dd>
        </div>
        <div>
          <dt>分辨率</dt>
          <dd>{media.resolution}</dd>
        </div>
        <div>
          <dt>视频/图像编码</dt>
          <dd>{media.videoCodec}</dd>
        </div>
        <div>
          <dt>音频编码</dt>
          <dd>{media.audioCodec}</dd>
        </div>
        <div>
          <dt>
            <Subtitles size={14} aria-hidden="true" />
            字幕轨
          </dt>
          <dd>{media.subtitleTracks}</dd>
        </div>
        <div>
          <dt>
            <HardDrive size={14} aria-hidden="true" />
            大小
          </dt>
          <dd>{media.size}</dd>
        </div>
      </dl>
    </section>
  );
}
