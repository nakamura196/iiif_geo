export interface PanesConfig {
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

// ヘッダーから開閉できるペインの定義。
// 新しいトグルペインを増やすときはここに 1 エントリ足すだけでよく、
// ヘッダー側に push/splice/watch の定型コードを書く必要はない。
export interface TogglePaneDef {
  id: string; // トップレベルのペイン id（splitpanes のキーも兼ねる）
  componentKey: string; // ペイン内に描画するコンポーネント
  size: number; // 列のデフォルト幅(%)
  query: string; // 状態を復元する URL クエリフラグ (?<query>=1)
}

export const TOGGLE_PANES: Record<string, TogglePaneDef> = {
  search: { id: "search", componentKey: "PanesSearch", size: 30, query: "search" },
  license: { id: "license", componentKey: "PanesLicense", size: 30, query: "license" },
};

export const usePanes = () => {
  const route = useRoute();

  const settings = useState<Settings>("settings", () => ({
    data: {
      xmlString: "",
      tei: null,
    },
    panes: [],
  }));

  // ペインの開閉状態は settings.panes を唯一の真実源とする
  // （ヘッダー側に別の boolean を持たせない）。
  const isPaneOpen = (id: string) =>
    settings.value.panes.some((pane) => pane.id === id);

  const openPane = (id: string) => {
    const def = TOGGLE_PANES[id];
    if (!def || isPaneOpen(id)) return;

    settings.value.panes.push({
      id: def.id,
      size: def.size,
      items: [
        {
          id: `${def.id}-0`,
          componentKey: def.componentKey,
          size: 100,
        },
      ],
    });
  };

  const closePane = (id: string) => {
    const panes = settings.value.panes;
    const index = panes.findIndex((pane) => pane.id === id);
    if (index > -1) {
      panes.splice(index, 1);
    }
  };

  const togglePane = (id: string) => {
    if (isPaneOpen(id)) {
      closePane(id);
    } else {
      openPane(id);
    }
  };

  // URL クエリ (?<query>=1) からトグルペインを復元する。
  const restorePaneFromQuery = (id: string) => {
    const def = TOGGLE_PANES[id];
    if (def && route.query[def.query] === "1") {
      openPane(id);
    }
  };

  return {
    settings,
    isPaneOpen,
    openPane,
    closePane,
    togglePane,
    restorePaneFromQuery,
  };
};
