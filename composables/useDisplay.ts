// composables/useDisplay.ts
import { ref } from "vue";
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
      } else if (data.type === "AnnotationPage") {
        manifestData = {
          items: [
            {
              items: [
                {
                  "items": [
                    {
                      "body": {
                        "id": "ddd",
                        "type": "Image",
                        "format": "image/jpeg",
                        "height": data.items[0].target.source.height,
                        "width": data.items[0].target.source.width,
                        "service": [
                        {
                        "id": data.items[0].target.source.id,
                        "type": "ImageService2"
                        }
                        ]
                        },
                    }
                  ]
                }
              ],
              annotations: [data],
            }
          ],
        };
      } else {
        manifestData = {
          label: data.label,
          items: [data],
        };
      }

      for (let itemIndex = 0; itemIndex < manifestData.items.length; itemIndex++) {
        const item = manifestData.items[itemIndex];
        const features = item.annotations[0].items[0].body.features;
        for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
          const feature = features[featureIndex];
          if (!feature.id) {
            // ページインデックスとフィーチャーインデックスを組み合わせたIDを作成（1ベース）
            feature.id = `feature_${itemIndex + 1}_${featureIndex + 1}`;
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
