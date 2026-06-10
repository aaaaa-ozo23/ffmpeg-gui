import type { FeatureConfig, FeatureId } from "../app/types";

type AppSidebarProps = {
  activeFeatureId: FeatureId;
  features: FeatureConfig[];
  onFeatureChange: (featureId: FeatureId) => void;
};

export function AppSidebar({
  activeFeatureId,
  features,
  onFeatureChange,
}: AppSidebarProps) {
  return (
    <aside className="sidebar" aria-label="功能导航">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          FG
        </div>
        <div>
          <p className="brand-title">FFmpeg GUI</p>
          <p className="brand-subtitle">轻量处理工具</p>
        </div>
      </div>

      <nav className="nav-list">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isActive = feature.id === activeFeatureId;

          return (
            <button
              className={isActive ? "nav-item nav-item-active" : "nav-item"}
              key={feature.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onFeatureChange(feature.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{feature.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>阶段 2 UI 壳</span>
      </div>
    </aside>
  );
}
