interface Action {
  id: string;
  type: string;
  // payload: any;
}

interface FeaturesMap {
  [key: string]: Feature;
}

interface Feature {
  properties: {
    resourceCoords: number[];
  },
  xywh: string,
  geometry: {
    type: string,
    coordinates: number[][],
  },
}

interface Canvas {
  items: any[];
  annotations: any[];
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
    }
  });

  return {
    canvas,
    featuresMap,
    action,
  };
};
