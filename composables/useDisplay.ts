// composables/useDisplay.ts
import { ref } from "vue";
import { v4 as uuidv4 } from "uuid";

export interface PanesConfig {
  id?: string;
  label?: string;
  size?: number;
  items?: PanesConfig[];
  componentKey?: string;
}

export function useDisplay() {
  const ready = ref(false);
  const snackbar = ref(false);
  const { canvas, featuresMap, title, manifest } = useSettings();
  const { settings } = usePanes();
  const defaultPanes: PanesConfig[] = [
    {
      size: 50,
      items: [
        {
          id: "0-0",
          componentKey: "PanesMap",
        },
      ],
    },
    {
      size: 50,
      items: [
        {
          id: "1-0",
          componentKey: "PanesOsd",
        },
      ],
    },
  ];
  settings.value.panes = defaultPanes;

  function init() {
    canvas.value = {
      items: [],
      annotations: [],
    };

    ready.value = false;
    title.value = "";
  }

  async function display(url: string) {
    init();

    if (!url) return;

    try {
      const data = await fetch(url).then((res) => res.json());

      const features = data.annotations
        ? data.annotations[0].items[0].body.features
        : data.items[0].annotations[0].items[0].body.features;

      if (data.items) {
        manifest.value = data;
      }

      let titles = [];

      const labelMap = data.label || data.items[0].label;
      for (const key in labelMap) {
        const label = labelMap[key];
        if (label) {
          titles.push(label[0]);
        }
      }

      title.value = titles.join(" ");

      const _featuresMap: any = {};

      for (const feature of features) {
        if (!feature.id) {
          feature.id = uuidv4();
        }
        if (!feature.label) {
          feature.label = "";
        }
        _featuresMap[feature.id] = feature;
      }

      canvas.value = data.annotations ? data : data.items[0];
      featuresMap.value = _featuresMap;
      ready.value = true;
    } catch (e) {
      snackbar.value = true;
    }
  }

  return {
    ready,
    snackbar,
    display,
  };
}
