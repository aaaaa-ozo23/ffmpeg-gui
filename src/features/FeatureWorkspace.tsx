import type { FeatureConfig, MediaProbeState } from "../app/types";
import { ConvertPanel } from "./convert/ConvertPanel";
import { FeaturePlaceholder } from "./FeaturePlaceholder";

type FeatureWorkspaceProps = {
  activeFeature: FeatureConfig;
  mediaState: MediaProbeState;
  onSelectMedia: () => void;
};

export function FeatureWorkspace({
  activeFeature,
  mediaState,
  onSelectMedia,
}: FeatureWorkspaceProps) {
  if (activeFeature.id === "convert") {
    return (
      <ConvertPanel mediaState={mediaState} onSelectMedia={onSelectMedia} />
    );
  }

  return <FeaturePlaceholder feature={activeFeature} mediaState={mediaState} />;
}
