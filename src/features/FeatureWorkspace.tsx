import type { FeatureConfig, MediaSummary } from "../app/types";
import { ConvertPanel } from "./convert/ConvertPanel";
import { FeaturePlaceholder } from "./FeaturePlaceholder";

type FeatureWorkspaceProps = {
  activeFeature: FeatureConfig;
  media: MediaSummary;
};

export function FeatureWorkspace({
  activeFeature,
  media,
}: FeatureWorkspaceProps) {
  if (activeFeature.id === "convert") {
    return <ConvertPanel media={media} />;
  }

  return <FeaturePlaceholder feature={activeFeature} media={media} />;
}
