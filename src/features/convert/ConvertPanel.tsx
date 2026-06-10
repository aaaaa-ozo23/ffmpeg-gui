import {
  ChevronDown,
  FileOutput,
  FolderOpen,
  Play,
  Settings2,
} from "lucide-react";
import type { MediaProbeState } from "../../app/types";
import { MediaSummaryPanel } from "../../components/MediaSummaryPanel";

type ConvertPanelProps = {
  mediaState: MediaProbeState;
  onSelectMedia: () => void;
};

export function ConvertPanel({ mediaState, onSelectMedia }: ConvertPanelProps) {
  const isProbing = mediaState.status === "loading";

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="convert-file-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">输入文件</p>
            <h2 id="convert-file-title">选择媒体</h2>
          </div>
          <button
            className="secondary-action"
            type="button"
            disabled={isProbing}
            onClick={onSelectMedia}
          >
            <FolderOpen size={16} aria-hidden="true" />
            {isProbing ? "读取中" : "选择文件"}
          </button>
        </div>

        <MediaSummaryPanel mediaState={mediaState} />
      </section>

      <section className="tool-panel" aria-labelledby="convert-settings-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">转换参数</p>
            <h2 id="convert-settings-title">输出配置</h2>
          </div>
          <span className="mode-chip">结构化参数</span>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>输出容器</span>
            <select defaultValue="mp4">
              <option value="mp4">MP4</option>
              <option value="mkv">MKV</option>
              <option value="mov">MOV</option>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="flac">FLAC</option>
            </select>
          </label>

          <label className="field">
            <span>视频编码</span>
            <select defaultValue="h264">
              <option value="copy">copy</option>
              <option value="h264">H.264</option>
              <option value="h265">H.265</option>
              <option value="vp9">VP9</option>
            </select>
          </label>

          <label className="field">
            <span>音频编码</span>
            <select defaultValue="aac">
              <option value="copy">copy</option>
              <option value="aac">AAC</option>
              <option value="mp3">MP3</option>
              <option value="flac">FLAC</option>
            </select>
          </label>

          <label className="field">
            <span>处理模式</span>
            <select defaultValue="reencode">
              <option value="reencode">重编码</option>
              <option value="copy">快速 remux</option>
            </select>
          </label>
        </div>

        <div className="output-row">
          <div className="output-icon" aria-hidden="true">
            <FileOutput size={18} />
          </div>
          <div>
            <span>输出路径</span>
            <p>D:\Media Output\sample demo 输出.mp4</p>
          </div>
          <button className="icon-button" type="button" aria-label="选择输出路径">
            <FolderOpen size={17} aria-hidden="true" />
          </button>
        </div>

        <details className="advanced-settings">
          <summary>
            <Settings2 size={16} aria-hidden="true" />
            高级设置
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <p>
            高级参数将在后端参数构造完成后接入。当前阶段只验证折叠区与布局。
          </p>
        </details>

        <div className="parameter-summary">
          <span>参数摘要</span>
          <p>
            {mediaState.status === "ready"
              ? `已读取 ${mediaState.summary.fileName}，转换任务将在阶段 6 接入。`
              : "选择媒体后先读取文件信息；转换任务将在阶段 6 接入。"}
          </p>
        </div>

        <button className="primary-action" type="button" disabled>
          <Play size={17} aria-hidden="true" />
          等待任务系统
        </button>
      </section>
    </div>
  );
}
