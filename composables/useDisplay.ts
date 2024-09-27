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
  const { title, manifest, canvases } = useSettings();
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
    canvases.value = [];

    ready.value = false;
    title.value = "";
  }

  async function display(url: string) {
    init();

    if (!url) return;

    try {
      const data = await fetch(url).then((res) => res.json());

      let manifestData;

      if (data.type === "Manifest") {
        manifest.value = data;
        manifestData = data;
      } else {
        manifestData = {
          label: data.label,
          items: [data],
        };
      }

      for (const item of manifestData.items) {
        const features = item.annotations[0].items[0].body.features;
        for (const feature of features) {
          if (!feature.id) {
            feature.id = uuidv4();
          }

          if (!feature.label) {
            feature.label = "";
          }
        }
      }

      let titles = [];

      const labelMap = manifestData.label;
      for (const key in labelMap) {
        const label = labelMap[key];
        if (label) {
          titles.push(label[0]);
        }
      }

      title.value = titles.join(" ");

      canvases.value = manifestData.items;

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
