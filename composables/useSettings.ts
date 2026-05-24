interface Action {
  id: string;
  type: string;
  // payload: any;
}

interface FeaturesMap {
  [key: string]: Feature;
}

interface FeatureLink {
  type: string; // e.g., "closeMatch", "primaryTopicOf", "exactMatch"
  identifier: string;
}

interface Feature {
  [x: string]: any;
  // Recommended: @id at top level (Linked Places Format / JSON-LD compatible)
  "@id"?: string;
  // Recommended: links at top level (Linked Places Format)
  links?: FeatureLink[];
  properties: {
    resourceCoords: number[];
    // Recommended: metadata in properties
    title?: string;
    tags?: string[];
    xywh?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][];
  };
  // Legacy: metadata object (still supported for backwards compatibility)
  metadata?: {
    id?: string;
    label?: string;
    tags?: string[];
    url?: string;
    xywh?: string;
    [key: string]: any;
  };
}

interface Canvas {
  items: any[];
  annotations: any[];
}

interface Manifest {
  requiredStatement?: any;
  rights?: string;
}

export const useSettings = () => {

  const featuresMap = useState<FeaturesMap>("featuresMap", () => {
    return {};
  });
  const action = useState<Action>("action", () => {
    return {
      id: "",
      type: "",
    };
  });

  const title = useState<string>("title", () => "");

  const manifest = useState<Manifest>("manifest", () => {
    return {};
  });

  const canvases = useState<Canvas[]>("canvases", () => []);

  const pageIndex = useState<number>("pageIndex", () => 0);

  return {
    title,
    featuresMap,
    action,
    manifest,
    canvases,
    pageIndex,
  };
};
