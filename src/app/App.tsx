import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Cpu,
  FolderOpen,
  LoaderCircle,
} from "lucide-react";
import { featureConfigs, mockLogs, mockTasks } from "./mockData";
import type {
  AppErrorPayload,
  FeatureId,
  InspectorTab,
  MediaProbeState,
  SidecarHealthState,
} from "./types";
import { AppSidebar } from "../components/AppSidebar";
import { InspectorPanel } from "../components/InspectorPanel";
import { FeatureWorkspace } from "../features/FeatureWorkspace";
import { checkFfmpegHealth, probeMedia, selectMediaFile, toMediaSummary } from "../lib";

function App() {
  const [activeFeatureId, setActiveFeatureId] =
    useState<FeatureId>("convert");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("tasks");
  const [sidecarHealth, setSidecarHealth] = useState<SidecarHealthState>({
    status: "loading",
  });
  const [mediaProbeState, setMediaProbeState] = useState<MediaProbeState>({
    status: "empty",
  });

  const activeFeature = useMemo(
    () =>
      featureConfigs.find((feature) => feature.id === activeFeatureId) ??
      featureConfigs[0],
    [activeFeatureId],
  );

  useEffect(() => {
    let canceled = false;

    checkFfmpegHealth()
      .then((health) => {
        if (!canceled) {
          setSidecarHealth({ status: "ready", health });
        }
      })
      .catch((error: unknown) => {
        if (!canceled) {
          setSidecarHealth({
            status: "error",
            error: error as AppErrorPayload,
          });
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  const handleSelectMedia = useCallback(async () => {
    let selectedPath: string | null = null;

    try {
      selectedPath = await selectMediaFile();
      if (!selectedPath) {
        return;
      }

      setMediaProbeState({ status: "loading", path: selectedPath });

      const media = await probeMedia(selectedPath);
      setMediaProbeState({
        status: "ready",
        media,
        summary: toMediaSummary(media),
      });
    } catch (error) {
      setMediaProbeState({
        status: "error",
        path: selectedPath ?? undefined,
        error: error as AppErrorPayload,
      });
    }
  }, []);

  const sidecarStatusTitle = useMemo(() => {
    if (sidecarHealth.status === "ready") {
      return [
        `target: ${sidecarHealth.health.targetTriple}`,
        sidecarHealth.health.ffmpeg.versionLine,
        sidecarHealth.health.ffprobe.versionLine,
      ].join("\n");
    }

    if (sidecarHealth.status === "error") {
      return [sidecarHealth.error.message, sidecarHealth.error.detail]
        .filter(Boolean)
        .join("\n");
    }

    return "正在检查项目内 FFmpeg/FFprobe sidecar";
  }, [sidecarHealth]);

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
            <button
              className="icon-button"
              type="button"
              aria-label="打开文件"
              onClick={handleSelectMedia}
              disabled={mediaProbeState.status === "loading"}
            >
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
            <span>结构化参数 UI</span>
          </div>

          {sidecarHealth.status === "ready" ? (
            <>
              <div
                className="status-metric status-metric-ready"
                title={sidecarStatusTitle}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>{sidecarHealth.health.ffmpeg.versionLine}</span>
              </div>
              <div
                className="status-metric status-metric-ready"
                title={sidecarStatusTitle}
              >
                <Cpu size={16} aria-hidden="true" />
                <span>{sidecarHealth.health.ffprobe.versionLine}</span>
              </div>
            </>
          ) : (
            <div
              className={`status-metric status-metric-${sidecarHealth.status}`}
              title={sidecarStatusTitle}
            >
              {sidecarHealth.status === "loading" ? (
                <LoaderCircle size={16} aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} aria-hidden="true" />
              )}
              <span>
                {sidecarHealth.status === "loading"
                  ? "正在检查 FFmpeg sidecar"
                  : `${sidecarHealth.error.message}：pnpm.cmd run sidecar:prepare`}
              </span>
            </div>
          )}
        </div>

        <FeatureWorkspace
          activeFeature={activeFeature}
          mediaState={mediaProbeState}
          onSelectMedia={handleSelectMedia}
        />
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
