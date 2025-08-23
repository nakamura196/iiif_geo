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
  const route = useRoute();
  
  // Check URL parameter for map type (default to MapGL)
  const useMapGL = route.query.mapType !== 'leaflet';
  const mapComponent = useMapGL ? "PanesMapGL" : "PanesMap";
  
  const defaultPanes: PanesConfig[] = [
    {
      size: 50,
      items: [
        {
          id: "0-0",
          componentKey: mapComponent,
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
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

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

      const validItems = [];
      
      for (let itemIndex = 0; itemIndex < manifestData.items.length; itemIndex++) {
        const item = manifestData.items[itemIndex];
        
        // Check if item has required image data for OSD viewer
        // Some manifests have service field, others have direct image URL in body.id
        const hasImageService = item.items?.[0]?.items?.[0]?.body?.service?.[0]?.id;
        const hasDirectImageUrl = item.items?.[0]?.items?.[0]?.body?.id;
        
        if (!hasImageService && !hasDirectImageUrl) {
          continue;
        }
        
        if (!item.annotations || !item.annotations[0]) {
          continue;
        }
        
        if (!item.annotations[0].items || !item.annotations[0].items[0]) {
          continue;
        }
        
        if (!item.annotations[0].items[0].body) {
          continue;
        }
        
        if (!item.annotations[0].items[0].body.features) {
          continue;
        }
        
        const features = item.annotations[0].items[0].body.features;
        for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
          const feature = features[featureIndex];
          
          // 事前定義されたIDを確認（properties.id または metadata.id）
          const predefinedId = feature.properties?.id || feature.metadata?.id;
          
          if (!feature.id) {
            if (predefinedId) {
              // 事前定義されたIDがある場合はそれを使用
              feature.id = predefinedId;
            } else {
              // 事前定義されたIDがない場合は自動生成
              feature.id = `feature_${itemIndex + 1}_${featureIndex + 1}`;
            }
          }

          if (!feature.label) {
            feature.label = "";
          }
        }
        
        validItems.push(item);
      }
      
      manifestData.items = validItems;

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
