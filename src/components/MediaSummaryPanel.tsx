import { FileVideo, HardDrive, Subtitles } from "lucide-react";
import type { MediaSummary } from "../app/types";

type MediaSummaryPanelProps = {
  media: MediaSummary;
};

export function MediaSummaryPanel({ media }: MediaSummaryPanelProps) {
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
          <dt>视频编码</dt>
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
