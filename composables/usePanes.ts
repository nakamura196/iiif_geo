/*
type Pane = {
    
}
*/

interface PanesConfig {
  id?: string;
  label?: string;
  size?: number;
  items?: PanesConfig[];
  componentKey?: string;
}

type Settings = {
  data: {
    xmlString: string;
    tei: any;
  };
  panes: PanesConfig[];
};

export const usePanes = () => {
  // const items = useState("items", () => [] as any);

  const settings = useState<Settings>("settings", () => ({
    data: {
      xmlString: "",
      tei: null,
    },
    panes: [],
  }));

  const panesConfig = useState<PanesConfig[]>("panesConfig", () => ([]));

  return {
    // items,
    settings,
    panesConfig
  };
};
