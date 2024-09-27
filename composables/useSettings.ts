interface Action {
  id: string;
  type: string;
  // payload: any;
}

interface FeaturesMap {
  [key: string]: Feature;
}

interface Feature {
  [x: string]: any;
  properties: {
    resourceCoords: number[];
  };
  xywh: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  metadata?: {
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
  const canvas = useState<Canvas>("canvas", () => {
    return {
      items: [],
      annotations: [],
    };
  });
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

  return {
    title,
    canvas,
    featuresMap,
    action,
    manifest,
  };
};
