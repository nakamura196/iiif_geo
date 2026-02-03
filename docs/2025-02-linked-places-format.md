# IIIF Georeference ViewerへのLinked Places Format対応

## 概要

IIIF Georeference Viewerにおいて、地理空間データの相互運用性を向上させるため、[Linked Places Format (LPF)](https://github.com/LinkedPasts/linked-places-format) に準拠したデータ構造をサポートしました。本記事では、LPFの概要と実装の詳細について説明します。

## Linked Places Format (LPF) とは

Linked Places Format は、[Pelagios Network](https://pelagios.org/) が策定した地名辞典データの相互運用フォーマットです。GeoJSONを拡張し、Linked Data (JSON-LD) の概念を取り入れることで、異なるデータセット間での場所情報の共有・連携を可能にします。

### LPFの特徴

1. **JSON-LD互換**: `@id` や `@context` を使用したセマンティックWeb対応
2. **GeoJSON拡張**: 標準的なGeoJSON構造を維持しつつ、メタデータを追加
3. **リンク機能**: 外部データセットへの参照を `links` 配列で表現
4. **時間情報**: `when` プロパティによる時間的な情報の記述

### 公式仕様

- GitHub: https://github.com/LinkedPasts/linked-places-format
- JSON-LD Context: https://raw.githubusercontent.com/LinkedPasts/linked-places/master/linkedplaces-context-v1.1.jsonld

## 従来のフォーマットとの比較

### 従来のフォーマット（metadata オブジェクト）

```json
{
  "type": "Feature",
  "properties": {
    "resourceCoords": [6690, 7517]
  },
  "geometry": {
    "type": "Point",
    "coordinates": [139.7623182, 35.7151233]
  },
  "metadata": {
    "id": "http://example.org/place/123",
    "label": "電気実験室",
    "tags": ["工学部"],
    "url": "https://maps.app.goo.gl/dJdXXQEA8dWSptgt8",
    "xywh": "5936,6344,976,1384"
  }
}
```

従来のフォーマットでは、`metadata` オブジェクト内に全てのメタデータを格納していました。これはシンプルですが、以下の課題がありました：

- 標準的なフォーマットではないため、他のツールとの相互運用性が低い
- Linked Dataとしての活用が困難
- 外部リソースへのリンクの種類（同一、類似など）を表現できない

### 新しい推奨フォーマット（LPF準拠）

```json
{
  "type": "Feature",
  "@id": "https://example.org/places/denki-jikkenshitsu",
  "properties": {
    "resourceCoords": [6690, 7517],
    "title": "電気実験室",
    "tags": ["工学部"],
    "xywh": "5936,6344,976,1384"
  },
  "links": [
    {
      "type": "primaryTopicOf",
      "identifier": "https://maps.app.goo.gl/dJdXXQEA8dWSptgt8"
    },
    {
      "type": "closeMatch",
      "identifier": "http://www.wikidata.org/entity/Q123456"
    }
  ],
  "geometry": {
    "type": "Point",
    "coordinates": [139.7623182, 35.7151233]
  }
}
```

## フォーマット設計の詳細

### @id の配置場所

GeoJSON標準 (RFC 7946) とLinked Places Formatでは、識別子の配置場所が異なります：

| フォーマット | キー | 場所 | 用途 |
| ---- | ---- | ---- | ---- |
| GeoJSON標準 | `id` | Feature直下 | ファイル内での単純なID |
| Linked Places Format | `@id` | Feature直下 | RDF/Linked DataとしてのURI識別子 |

LPFの公式サンプルを確認すると、`@id` はFeature直下に配置されています：

```json
{
  "type": "FeatureCollection",
  "@context": "https://raw.githubusercontent.com/LinkedPasts/linked-places/master/linkedplaces-context-v1.1.jsonld",
  "features": [
    {
      "@id": "http://mygaz.org/places/p_12345",
      "type": "Feature",
      "properties": {
        "title": "Abingdon (UK)"
      },
      "links": [...]
    }
  ]
}
```

### title の配置場所

LPFでは `title` は `properties` 内に配置されます。これはGISソフト（QGISなど）で読み込まれた際に、属性データとして情報が保持されるようにするための設計です。

### links 配列

`links` はFeature直下に配置され、外部リソースへの参照を表現します。各リンクは `type` と `identifier` を持ちます：

```json
"links": [
  {"type": "exactMatch", "identifier": "http://vocab.getty.edu/tgn/7011944"},
  {"type": "closeMatch", "identifier": "http://somegaz.org/places/39847"},
  {"type": "primaryTopicOf", "identifier": "https://en.wikipedia.org/wiki/..."},
  {"type": "seeAlso", "identifier": "https://example.org/related"}
]
```

#### リンクタイプの種類

| タイプ | 説明 | 用途例 |
| ---- | ---- | ---- |
| `exactMatch` | 完全に同一のリソース | Getty TGN, GeoNames |
| `closeMatch` | 類似するリソース | 他の地名辞典 |
| `primaryTopicOf` | この場所についてのWebページ | Wikipedia, Google Maps |
| `subjectOf` | この場所に言及するドキュメント | 歴史文献 |
| `seeAlso` | 関連するリソース | 関連情報 |

## 実装の詳細

### 型定義の更新

```typescript
// composables/useSettings.ts
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
```

### ID解決の優先順位

新旧両方のフォーマットをサポートするため、IDは以下の優先順位で解決されます：

```typescript
// composables/useDisplay.ts
// IDの優先順位: @id (LPF) > id (GeoJSON) > properties.id > metadata.id > 自動生成
const predefinedId = feature["@id"] || feature.id || feature.properties?.id || feature.metadata?.id;

if (!feature.id) {
  if (predefinedId) {
    feature.id = predefinedId;
  } else {
    feature.id = `feature_${itemIndex + 1}_${featureIndex + 1}`;
  }
}

// labelの優先順位: properties.title (推奨) > metadata.label (レガシー)
if (!feature.label) {
  feature.label = feature.properties?.title || feature.metadata?.label || "";
}
```

### ポップアップ表示の更新

```typescript
// components/panes/Map.vue
// 新フォーマット (LPF/properties) と旧フォーマット (metadata) の両方をサポート
const metadata = feature.metadata || {};
const props = feature.properties || {};

// ID: @id (LPF) > id (GeoJSON) > metadata.id (レガシー)
const displayId = feature["@id"] || feature.id || metadata.id;
// title: properties.title (推奨) > metadata.label (レガシー)
const displayTitle = props.title || metadata.label;
// tags: properties.tags (推奨) > metadata.tags (レガシー)
const displayTags = props.tags || metadata.tags;
// links: feature.links (LPF) > metadata.url (レガシー)
const displayLinks = feature.links || [];
const legacyUrl = metadata.url;

// linksの表示を生成
let linksHtml = '';
if (displayLinks.length > 0) {
  linksHtml = displayLinks.map((link: any) =>
    `<a target="_blank" href="${link.identifier}">${link.type}</a>`
  ).join(' | ');
} else if (legacyUrl) {
  linksHtml = `<a target="_blank" href="${legacyUrl}">${t("detail")}</a>`;
}
```

### MapGL用のGeoJSON変換

```typescript
// components/panes/MapGL.vue
const geojsonFeatures = features.map((feature: any) => {
  const metadata = feature.metadata || {};
  const props = feature.properties || {};

  // ID: @id (LPF) > id (GeoJSON) > metadata.id (レガシー)
  const displayId = feature["@id"] || feature.id || metadata.id;
  // title: properties.title (推奨) > metadata.label (レガシー)
  const displayTitle = props.title || metadata.label || '';
  // tags: properties.tags (推奨) > metadata.tags (レガシー)
  const displayTags = props.tags || metadata.tags || [];
  // links: feature.links (LPF)
  const displayLinks = feature.links || [];
  // url: metadata.url (レガシー)
  const legacyUrl = metadata.url || '';

  return {
    type: 'Feature',
    properties: {
      id: displayId,
      label: displayTitle,
      tags: displayTags,
      links: displayLinks,
      url: legacyUrl
    },
    geometry: {
      type: 'Point',
      coordinates: [feature.geometry?.coordinates?.[0] || 0, feature.geometry?.coordinates?.[1] || 0]
    }
  };
});
```

## 後方互換性

既存のデータを壊さないよう、従来の `metadata` オブジェクト形式も引き続きサポートしています。新旧フォーマットが混在していても正しく動作します：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "@id": "https://example.org/places/new-format",
      "properties": {
        "resourceCoords": [100, 200],
        "title": "新フォーマットの例"
      },
      "links": [{"type": "primaryTopicOf", "identifier": "https://..."}],
      "geometry": {"type": "Point", "coordinates": [139.0, 35.0]}
    },
    {
      "type": "Feature",
      "properties": {"resourceCoords": [300, 400]},
      "geometry": {"type": "Point", "coordinates": [140.0, 36.0]},
      "metadata": {
        "label": "旧フォーマットの例",
        "url": "https://..."
      }
    }
  ]
}
```

## LPFを採用するメリット

### 1. 相互運用性の向上

LPFは地名辞典（gazetteer）間でのデータ交換を目的として設計されています。以下のようなプロジェクトとの連携が容易になります：

- [World Historical Gazetteer](https://whgazetteer.org/)
- [Pleiades](https://pleiades.stoa.org/)
- [Getty Thesaurus of Geographic Names](https://www.getty.edu/research/tools/vocabularies/tgn/)

### 2. Linked Data対応

`@id` を使用することで、各場所をURIで一意に識別でき、Linked Dataとして活用できます。これにより：

- RDFへの変換が容易
- SPARQLでのクエリが可能
- セマンティックWebへの統合

### 3. リンク関係の明示

`links` 配列により、外部リソースとの関係性を明示的に表現できます：

- **exactMatch**: 「この場所はGetty TGNのこのエントリと同一」
- **closeMatch**: 「この場所はWikidataのこのエンティティと類似」
- **primaryTopicOf**: 「この場所についてはWikipediaのこの記事を参照」

### 4. GISツールとの互換性

`title` や `tags` を `properties` 内に配置することで、QGISなどのGISツールで読み込んだ際に属性テーブルとして表示されます。

## 今後の展望

### 時間情報のサポート

LPFでは `when` プロパティで時間的な情報を記述できます：

```json
{
  "@id": "http://example.org/places/old-building",
  "properties": {
    "title": "旧本館"
  },
  "when": {
    "timespans": [
      {"start": {"in": "1877"}, "end": {"in": "1923"}}
    ]
  }
}
```

将来的には、この時間情報を活用した時系列表示機能の追加を検討しています。

### FeatureCollection レベルの @context

完全なLPF対応として、FeatureCollectionレベルでの `@context` 指定もサポート予定です：

```json
{
  "type": "FeatureCollection",
  "@context": "https://raw.githubusercontent.com/LinkedPasts/linked-places/master/linkedplaces-context-v1.1.jsonld",
  "features": [...]
}
```

## まとめ

Linked Places Formatの採用により、IIIF Georeference Viewerは地理空間データの相互運用性を大幅に向上させました。既存のデータとの後方互換性を維持しつつ、Linked Dataの概念を取り入れることで、より豊かなメタデータ表現と外部リソースとの連携が可能になりました。

歴史地理情報の研究や、デジタルアーカイブプロジェクトにおいて、異なるデータセット間での場所情報の共有・参照が容易になることを期待しています。

## 参考資料

- [Linked Places Format仕様](https://github.com/LinkedPasts/linked-places-format)
- [Pelagios Network](https://pelagios.org/)
- [IIIF Georeference Extension](https://iiif.io/api/extension/georef/)
- [GeoJSON (RFC 7946)](https://datatracker.ietf.org/doc/html/rfc7946)
