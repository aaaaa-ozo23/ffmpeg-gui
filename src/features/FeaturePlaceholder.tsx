import { CircleHelp, Clock, SlidersHorizontal } from "lucide-react";
import type { FeatureConfig, MediaSummary } from "../app/types";
import { MediaSummaryPanel } from "../components/MediaSummaryPanel";

type FeaturePlaceholderProps = {
  feature: FeatureConfig;
  media: MediaSummary;
};

export function FeaturePlaceholder({
  feature,
  media,
}: FeaturePlaceholderProps) {
  const Icon = feature.icon;

  return (
    <div className="feature-stack">
      <MediaSummaryPanel media={media} />

      <section className="tool-panel" aria-labelledby={`${feature.id}-title`}>
        <div className="panel-heading">
          <div>
            <p className="section-label">{feature.summary}</p>
            <h2 id={`${feature.id}-title`}>{feature.label}参数</h2>
          </div>
          <div className="panel-icon" aria-hidden="true">
            <Icon size={20} />
          </div>
        </div>

        <div className="placeholder-grid">
          <div className="placeholder-item">
            <SlidersHorizontal size={18} aria-hidden="true" />
            <div>
              <h3>高频参数区</h3>
              <p>后续阶段在这里放置该功能的主要输入控件。</p>
            </div>
          </div>
          <div className="placeholder-item">
            <Clock size={18} aria-hidden="true" />
            <div>
              <h3>输出策略</h3>
              <p>保留输出路径、格式和任务创建状态的位置。</p>
            </div>
          </div>
          <div className="placeholder-item">
            <CircleHelp size={18} aria-hidden="true" />
            <div>
              <h3>错误提示</h3>
              <p>真实校验接入后，将展示可操作的失败原因。</p>
            </div>
          </div>
        </div>

        <button className="primary-action" type="button" disabled>
          等待后端接入
        </button>
      </section>
    </div>
  );
}
