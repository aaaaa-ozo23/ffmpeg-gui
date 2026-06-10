import { useMemo, useState } from "react";
import { Activity, ClipboardList, Cpu, FolderOpen } from "lucide-react";
import { featureConfigs, mockLogs, mockMedia, mockTasks } from "./mockData";
import type { FeatureId, InspectorTab } from "./types";
import { AppSidebar } from "../components/AppSidebar";
import { InspectorPanel } from "../components/InspectorPanel";
import { FeatureWorkspace } from "../features/FeatureWorkspace";

function App() {
  const [activeFeatureId, setActiveFeatureId] =
    useState<FeatureId>("convert");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("tasks");

  const activeFeature = useMemo(
    () =>
      featureConfigs.find((feature) => feature.id === activeFeatureId) ??
      featureConfigs[0],
    [activeFeatureId],
  );

  return (
    <main className="app-window">
      <AppSidebar
        activeFeatureId={activeFeatureId}
        features={featureConfigs}
        onFeatureChange={setActiveFeatureId}
      />

      <section className="workspace" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <p className="section-label">当前功能</p>
            <h1 id="workspace-title">{activeFeature.label}</h1>
            <p className="workspace-summary">{activeFeature.description}</p>
          </div>

          <div className="header-actions" aria-label="工作区状态">
            <button className="icon-button" type="button" aria-label="打开文件">
              <FolderOpen size={18} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="任务清单">
              <ClipboardList size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="workspace-status" aria-label="开发状态">
          <div className="status-metric">
            <Activity size={16} aria-hidden="true" />
            <span>UI mock 模式</span>
          </div>
          <div className="status-metric">
            <Cpu size={16} aria-hidden="true" />
            <span>后端接口待接入</span>
          </div>
        </div>

        <FeatureWorkspace activeFeature={activeFeature} media={mockMedia} />
      </section>

      <InspectorPanel
        activeTab={inspectorTab}
        logs={mockLogs}
        tasks={mockTasks}
        onTabChange={setInspectorTab}
      />
    </main>
  );
}

export default App;
