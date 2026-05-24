// Shared sample IIIF resources, surfaced both on the landing page
// (HeadersForm) and in the "Add" dialog (HeadersFormButton) so the list stays
// in a single place. `value` is resolved against the app's public base URL.
export interface IiifExample {
  label: { ja: string; en: string };
  description: { ja: string; en: string };
  value: string;
}

export function useIiifExamples(): IiifExample[] {
  const baseURL = useRuntimeConfig().public.appURL;
  return [
    {
      label: { ja: "ラベルを含む例", en: "Example with labels" },
      description: {
        ja: "メタデータとラベルを含む完全な例",
        en: "Full example with metadata and labels",
      },
      value: baseURL + "/canvas_extra.json",
    },
    {
      label: { ja: "シンプルな例", en: "Simple example" },
      description: {
        ja: "基本的なジオリファレンス設定",
        en: "Basic georeference setup",
      },
      value: baseURL + "/canvas.json",
    },
    {
      label: { ja: "マニフェストの例", en: "Manifest example" },
      description: {
        ja: "IIIFマニフェスト形式の例",
        en: "IIIF manifest format example",
      },
      value: baseURL + "/manifest.json",
    },
  ];
}
