<script lang="ts" setup>
import {
  mdiPlus,
  mdiMinus,
  mdiHome,
  mdiFullscreen,
  mdiRestore,
  mdiMessage,
  mdiMessageOff,
  mdiArrowLeft,
  mdiArrowRight,
  mdiAutoFix,
  mdiRotate3d,
  mdiRotateRight,
  mdiRotateLeft,
  mdiCrosshairsGps,
  mdiShape,
} from "@mdi/js";
import { calculateImageRotation, calculateImageRotationAdvanced, findNearestThreePoints, calculateLocalRotation } from "~/utils/calculateImageRotation";
import { useDisplay } from "vuetify";

const { $OpenSeadragon } = useNuxtApp();
const { mobile, mdAndUp } = useDisplay();

const { featuresMap, action, canvases, pageIndex } = useSettings();

let viewer: any = null;

watch(
  () => action.value,
  (value) => {
    if (value.type === "map" || value.type === "both") {
      const feature = featuresMap.value[value.id];

      if (!feature || !feature.properties || !feature.properties.resourceCoords) {
        console.warn('Feature or resourceCoords not found for id:', value.id);
        return;
      }

      const resourceCoords = feature.properties.resourceCoords;

      const x = resourceCoords[0];
      const y = resourceCoords[1];

      const viewport = viewer.viewport;

      const point = viewport.imageToViewportCoordinates(x, y);

      viewport.panTo(point);

      removeSelected();
      setSelected(value.id);

      // クラスタリングが有効な場合、クラスター表示を更新
      if (enableClustering.value && showAnnotations.value) {
        updateAnnotationDisplay();
      }

      // 自動回転がONの場合、局所的な回転を計算
      if (autoRotateOnSelect.value) {
        calculateLocalRotationOnSelect(value.id);
      }
    }
    // actionが変更されたらURLを更新
    debouncedUpdateURLParams();
  }
);

// async
onMounted(async () => {
  const index = 0;

  const canvas_ = canvases.value[index];
  
  if (!canvas_ || !canvas_.items?.[0]?.items?.[0]?.body?.service?.[0]?.id) {
    console.error('Canvas data structure is incomplete');
    return;
  }

  const info = canvas_.items[0].items[0].body.service[0].id + "/info.json";

  const infoJson = await fetch(info).then((res) => res.json());

  const tileSources = canvases.value.map((canvas_) => {
    if (!canvas_.items?.[0]?.items?.[0]?.body?.service?.[0]?.id) {
      console.warn('Canvas missing service data:', canvas_);
      return '';
    }
    return canvas_.items[0].items[0].body.service[0].id + "/info.json";
  }).filter(Boolean);

  const config: any = {
    id: "osd",
    prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
    sequenceMode: true,
    tileSources,
    zoomInButton: "zoom-in",
    zoomOutButton: "zoom-out",
    homeButton: "home",
    fullPageButton: "full-page",
    nextButton: "next",
    previousButton: "previous",
  };

  viewer = $OpenSeadragon(config);

  const updateFeatureMap = () => {
    const pageIndex_ = pageIndex.value;

    const canvas_ = canvases.value[pageIndex_];

    if (!canvas_) {
      return;
    }

    if (!canvas_.annotations || !canvas_.annotations[0] || !canvas_.annotations[0].items?.[0]?.body?.features) {
      return;
    }

    const features = canvas_.annotations[0].items[0].body.features;

    const _featuresMap: any = {};

    for (const feature of features) {
      _featuresMap[feature.id] = feature;
    }

    featuresMap.value = _featuresMap;
  };

  viewer.addHandler("open", () => {
    updateFeatureMap();

    // URLパラメータから初期状態を復元
    isRestoringFromURL.value = true;

    const query = route.query;
    if (query.annotations === 'true') {
      showAnnotations.value = true;
    }
    if (query.clustering === 'true') {
      enableClustering.value = true;
    }
    if (query.autoRotateOnSelect === 'true') {
      autoRotateOnSelect.value = true;
    }

    // アノテーション/クラスタリングの初期表示を確実に実行
    if (showAnnotations.value) {
      nextTick(() => {
        updateAnnotationDisplay();
      });
    }
    if (query.zoom) {
      const zoom = parseFloat(query.zoom as string);
      if (!isNaN(zoom)) {
        viewer.viewport.zoomTo(zoom);
      }
    }
    // 中央座標の復元
    if (query.centerX && query.centerY) {
      const centerX = parseFloat(query.centerX as string);
      const centerY = parseFloat(query.centerY as string);
      if (!isNaN(centerX) && !isNaN(centerY)) {
        viewer.viewport.panTo(new $OpenSeadragon.Point(centerX, centerY));
      }
    }
    // 回転角度の復元
    if (query.rotation) {
      const rotation = parseFloat(query.rotation as string);
      if (!isNaN(rotation)) {
        rotate.value = rotation;
        rotate2.value = rotation;
      }
    } else {
      // rotateパラメータが未指定の場合は自動回転を実行
      setTimeout(() => {
        if (Object.keys(featuresMap.value).length >= 2) {
          calculateRotation();
        }
      }, 500); // featuresMapが更新されるまで待つ
    }

    // 選択IDの復元と中心表示
    if (query.id) {
      const id = query.id as string;
      // featuresMapが準備できるまで監視（デプロイ環境対応）
      let attempts = 0;
      const maxAttempts = 100; // 10秒間待機
      const checkFeature = () => {
        attempts++;

        if (Object.keys(featuresMap.value).length > 0 && featuresMap.value[id]) {
          const feature = featuresMap.value[id];

          // 画像上でその位置を中心に表示
          if (feature.properties?.resourceCoords && Array.isArray(feature.properties.resourceCoords) && feature.properties.resourceCoords.length >= 2) {
            const x = feature.properties.resourceCoords[0];
            const y = feature.properties.resourceCoords[1];
            if (typeof x === 'number' && typeof y === 'number') {
              const point = viewer.viewport.imageToViewportCoordinates(x, y);
              viewer.viewport.panTo(point);
            }
          }

          // IDが指定されている場合はアノテーションを自動表示
          if (!showAnnotations.value) {
            showAnnotations.value = true;
            // アノテーション表示後に選択状態を設定
            setTimeout(() => {
              removeSelected();
              setSelected(id);
            }, 100);
          } else {
            // アノテーションが表示されている場合は選択状態にする
            removeSelected();
            setSelected(id);
          }

          // actionに設定して地図と同期
          action.value = {
            type: "both", // 地図も更新するため
            id,
          };

          // ID復元完了後、フラグを解除
          setTimeout(() => {
            isRestoringFromURL.value = false;
          }, 200);
        } else if (attempts < maxAttempts) {
          // まだ準備できていない場合は再試行
          setTimeout(checkFeature, 100);
        } else {
          // タイムアウト時もフラグを解除
          isRestoringFromURL.value = false;
        }
      };
      // 初回実行を少し遅延（デプロイ環境ではさらに遅延）
      setTimeout(checkFeature, 500);
    } else {
      // IDがない場合は即座にフラグを解除
      setTimeout(() => {
        isRestoringFromURL.value = false;
      }, 200);
    }
  });

  viewer.addHandler(
    "page",
    (value: { eventSource: any; page: number; previousPage: number }) => {
      pageIndex.value = value.page;

      updateFeatureMap();
    }
  );
});

const rotate = ref(0);
const rotate2 = ref(0);
const showAnnotations = ref(true);
const showRotationDialog = ref(false);
const showAnnotationDialog = ref(false);
const isCalculatingRotation = ref(false);
const autoRotateOnSelect = ref(false);
const enableClustering = ref(true);
const spiderfiedCluster = ref<string | null>(null); // 現在展開されているクラスターのID

const route = useRoute();
const router = useRouter();

watch(
  () => rotate.value,
  (value) => {
    viewer.viewport.setRotation(-1 * value);
    if (!isRestoringFromURL.value) {
      debouncedUpdateURLParams();
    }
    // クラスタリング表示時は数字の回転を更新
    if (enableClustering.value && showAnnotations.value) {
      // 全てのクラスターカウントの回転を更新
      const clusterCounts = document.querySelectorAll('.cluster-count');
      clusterCounts.forEach((element: any) => {
        element.style.transform = `rotate(${value}deg)`;
      });
    }
  }
);

// URLパラメータを更新する関数
const updateURLParams = () => {
  const params = new URLSearchParams(window.location.search);

  // アノテーション表示状態
  if (showAnnotations.value) {
    params.set('annotations', 'true');
  } else {
    params.delete('annotations');
  }

  // クラスタリング状態
  if (enableClustering.value) {
    params.set('clustering', 'true');
  } else {
    params.delete('clustering');
  }

  // 自動回転（局所回転）状態
  if (autoRotateOnSelect.value) {
    params.set('autoRotateOnSelect', 'true');
  } else {
    params.delete('autoRotateOnSelect');
  }

  // ズームレベル
  if (viewer && viewer.viewport) {
    const zoom = viewer.viewport.getZoom();
    if (typeof zoom === 'number') {
      params.set('zoom', zoom.toFixed(2));
    }

    // ビューポートの中央座標
    const center = viewer.viewport.getCenter();
    if (center && typeof center.x === 'number' && typeof center.y === 'number') {
      params.set('centerX', center.x.toFixed(4));
      params.set('centerY', center.y.toFixed(4));
    }
  }

  // 回転角度
  params.set('rotation', rotate.value.toString());

  // 選択されているIDを追加
  if (action.value && action.value.id) {
    params.set('id', action.value.id);
  }

  // 既存のパラメータを保持
  if (route.query.u) {
    params.set('u', route.query.u as string);
  }
  // 地図のパラメータも保持
  const mapParams = ['mapZoom', 'mapLat', 'mapLng'];
  for (const param of mapParams) {
    if (route.query[param]) {
      params.set(param, route.query[param] as string);
    }
  }

  // URLを更新（History APIを使用してリロードを防ぐ）
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

// ズーム変更を監視（デバウンス付き）
let zoomHandler: any = null;
let zoomTimeout: any = null;
let annotationUpdateTimeout: any = null;

const debouncedUpdateURLParams = () => {
  if (zoomTimeout) {
    clearTimeout(zoomTimeout);
  }
  zoomTimeout = setTimeout(() => {
    updateURLParams();
  }, 500); // 500ms のデバウンス
};

// アノテーション表示更新のデバウンス
const debouncedUpdateAnnotationDisplay = () => {
  if (annotationUpdateTimeout) {
    clearTimeout(annotationUpdateTimeout);
  }
  annotationUpdateTimeout = setTimeout(() => {
    // ズームやパン時はspiderfy状態をリセット
    spiderfiedCluster.value = null;
    updateAnnotationDisplay();
  }, 150); // 150ms のデバウンス（URLパラメータよりも短く）
};

// パン（移動）イベントも監視
let panHandler: any = null;

onMounted(() => {
  setTimeout(() => {
    if (viewer) {
      zoomHandler = viewer.addHandler('zoom', () => {
        debouncedUpdateURLParams();
        // アノテーション表示時、ズーム変更時にアノテーション表示を更新
        if (showAnnotations.value) {
          debouncedUpdateAnnotationDisplay();
        }
      });
      panHandler = viewer.addHandler('pan', () => {
        debouncedUpdateURLParams();
        // アノテーション表示時、パン時にもアノテーション表示を更新
        if (showAnnotations.value) {
          debouncedUpdateAnnotationDisplay();
        }
      });
    }
  }, 1000);
});

onUnmounted(() => {
  if (viewer) {
    if (zoomHandler) {
      viewer.removeHandler('zoom', zoomHandler);
    }
    if (panHandler) {
      viewer.removeHandler('pan', panHandler);
    }
  }
  if (zoomTimeout) {
    clearTimeout(zoomTimeout);
  }
  if (annotationUpdateTimeout) {
    clearTimeout(annotationUpdateTimeout);
  }
});

// アノテーション表示の更新
const updateAnnotationDisplay = () => {
  viewer.clearOverlays();

  if (!showAnnotations.value) {
    return;
  }

  const allFeatures = Object.values(featuresMap.value);

  const worldItem = viewer.world.getItemAt(0);
  if (!worldItem) {
    console.error('No world item found');
    return;
  }
  const contentSize = worldItem.getContentSize();
  if (!contentSize) {
    console.error('No content size found');
    return;
  }
  const fullWidth = contentSize.x;
  const fullHeight = contentSize.y;

  // クラスタリングが有効な場合
  if (enableClustering.value) {
    // 回転時のビューポート座標変換が複雑なため、簡易的なアプローチを使用
    // ビューポートの中心とサイズから画像座標の範囲を推定
    const bounds = viewer.viewport.getBounds();
    const center = viewer.viewport.getCenter();
    const centerImg = viewer.viewport.viewportToImageCoordinates(center);

    // ズームレベルから可視範囲を推定
    const zoom = viewer.viewport.getZoom();
    // ズームが大きいほど可視範囲は小さい
    const visibleWidth = fullWidth / zoom;
    const visibleHeight = fullHeight / zoom;

    // マージンを追加（回転を考慮して適度に）
    const margin = 0.5; // 50%のマージン
    const minX = centerImg.x - visibleWidth * (0.5 + margin);
    const maxX = centerImg.x + visibleWidth * (0.5 + margin);
    const minY = centerImg.y - visibleHeight * (0.5 + margin);
    const maxY = centerImg.y + visibleHeight * (0.5 + margin);

    const visibleFeatures = allFeatures.filter((feature: any) => {
      if (!feature.properties?.resourceCoords || feature.properties.resourceCoords.length < 2) {
        return false;
      }

      const x = feature.properties.resourceCoords[0];
      const y = feature.properties.resourceCoords[1];
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });


    // 現在のズームレベルを取得
    const currentZoom = viewer.viewport.getZoom();

    // アノテーション数とズームレベルに応じてクラスタ半径を動的に調整
    // データセット全体のサイズに基づいて閾値を自動計算（汎用的）
    const totalCount = allFeatures.length;
    const baseRadius = fullWidth * 0.05;
    let clusterRadius: number;

    // データセット全体に対する可視アノテーションの割合で判定
    const visibleRatio = visibleFeatures.length / totalCount;

    if (visibleRatio > 0.25 || visibleFeatures.length > 1000) {
      // 全体の25%以上 または 1000件以上: 非常に積極的にクラスタリング
      // 2万件データセットなら5000件以上、1882件なら470件以上
      clusterRadius = baseRadius / Math.pow(currentZoom, 0.3);
    } else if (visibleRatio > 0.10 || visibleFeatures.length > 500) {
      // 全体の10-25% または 500-1000件: 積極的にクラスタリング
      // 2万件なら2000-5000件、1882件なら188-470件
      clusterRadius = baseRadius / Math.pow(currentZoom, 0.5);
    } else if (visibleRatio > 0.05 || visibleFeatures.length > 200) {
      // 全体の5-10% または 200-500件: やや積極的にクラスタリング
      // 2万件なら1000-2000件、1882件なら94-188件
      clusterRadius = baseRadius / Math.pow(currentZoom, 0.7);
    } else if (visibleRatio > 0.025 || visibleFeatures.length > 100) {
      // 全体の2.5-5% または 100-200件: 標準的なクラスタリング
      // 2万件なら500-1000件、1882件なら47-94件
      clusterRadius = baseRadius / currentZoom;
    } else {
      // それ以下: クラスタリングを緩く（個別マーカーを早めに表示）
      clusterRadius = baseRadius / Math.pow(currentZoom, 1.5);
    }

    const clusters = clusterFeatures(visibleFeatures, clusterRadius, currentZoom);

    for (const cluster of clusters) {
      // spiderfy展開されているクラスターの場合、個別マーカーを放射状に配置
      if (spiderfiedCluster.value === cluster.id && cluster.features.length > 1) {
        const centerX = cluster.center[0];
        const centerY = cluster.center[1];
        const count = cluster.features.length;

        // 放射状配置の半径（ズームレベルに応じて調整）
        const spiderfyRadius = (fullWidth * 0.02) / currentZoom;

        // 中心点のマーカーを追加
        const centerOverlay = document.createElement("div");
        centerOverlay.className = "spiderfy-center";
        viewer.addOverlay({
          element: centerOverlay,
          x: Number(centerX) / fullWidth,
          y: Number(centerY) / fullWidth,
          placement: "CENTER",
          checkResize: false,
        });

        cluster.features.forEach((feature: any, index: number) => {
          // 円周上に均等に配置
          const angle = (index / count) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * spiderfyRadius;
          const offsetY = Math.sin(angle) * spiderfyRadius;

          const featureX = centerX + offsetX;
          const featureY = centerY + offsetY;
          const x = Number(featureX) / fullWidth;
          const y = Number(featureY) / fullWidth;

          // 接続線を追加（SVG line要素）
          const lineOverlay = document.createElement("div");
          lineOverlay.className = "spiderfy-line";
          lineOverlay.style.position = "absolute";
          lineOverlay.style.width = "0";
          lineOverlay.style.height = "0";

          // SVGで線を描画
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.style.position = "absolute";
          svg.style.overflow = "visible";
          svg.style.pointerEvents = "none";

          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", "0");
          line.setAttribute("y1", "0");
          line.setAttribute("x2", String(offsetX));
          line.setAttribute("y2", String(offsetY));
          line.setAttribute("stroke", "#666");
          line.setAttribute("stroke-width", "1");
          line.setAttribute("opacity", "0.6");

          svg.appendChild(line);
          lineOverlay.appendChild(svg);

          viewer.addOverlay({
            element: lineOverlay,
            x: Number(centerX) / fullWidth,
            y: Number(centerY) / fullWidth,
            placement: "CENTER",
            checkResize: false,
          });

          const overlay_ = document.createElement("div");
          overlay_.id = feature.id;
          const isSelected = action.value && action.value.id && feature.id === action.value.id;
          overlay_.className = isSelected ? "pin-icon pin-selected spiderfy-marker" : "pin-icon spiderfy-marker";

          const overlay = {
            element: overlay_,
            x,
            y,
            placement: "CENTER",
            checkResize: false,
          };

          viewer.addOverlay(overlay);

          // 個別マーカーのクリックハンドラー
          new $OpenSeadragon.MouseTracker({
            element: overlay_,
            clickHandler: function (e: any) {
              const id = feature.id;

              removeSelected();
              setSelected(id);

              action.value = {
                type: "osd",
                id,
              };
            },
          });
        });

        continue; // このクラスターの処理を終了
      }

      const x = Number(cluster.center[0]) / fullWidth;
      const y = Number(cluster.center[1]) / fullWidth;

      // クラスターマーカーの作成
      const overlay_ = document.createElement("div");
      overlay_.id = cluster.id;

      if (cluster.features.length > 1) {
        // 複数の特徴を含むクラスター
        const count = cluster.features.length;

        // マーカー数に応じて色を設定（MapLibre GLと統一）
        let bgColor = '#51bbd6'; // デフォルト: 水色（10未満）

        if (count >= 30) {
          bgColor = '#f28cb1'; // ピンク（30以上）
        } else if (count >= 10) {
          bgColor = '#f1f075'; // 黄色（10-29）
        }

        overlay_.className = "cluster-icon";
        overlay_.style.backgroundColor = bgColor;

        // 画像の回転角度の逆方向に数字を回転させる
        // MapLibre GLと統一: 全て黒文字+白縁
        const currentRotation = rotate.value || 0;
        overlay_.innerHTML = `<span class="cluster-count" style="transform: rotate(${currentRotation}deg); display: inline-block;">${count}</span>`;
      } else {
        // 単一の特徴（クラスター解除後）
        const feature = cluster.features[0];
        const isSelected = action.value && action.value.id && feature.id === action.value.id;
        overlay_.className = isSelected ? "pin-icon pin-selected" : "pin-icon";
      }

      const overlay = {
        element: overlay_,
        x,
        y,
        placement: "CENTER",
        checkResize: false,
      };

      viewer.addOverlay(overlay);

      // クリックハンドラー
      new $OpenSeadragon.MouseTracker({
        element: overlay_,
        clickHandler: function (e: any) {
          if (cluster.features.length > 1) {
            // クラスターの座標の分散を計算して、同一座標かどうか判定
            const coords = cluster.features.map((f: any) => f.properties.resourceCoords);
            const xValues = coords.map((c: number[]) => c[0]);
            const yValues = coords.map((c: number[]) => c[1]);
            const xVariance = Math.max(...xValues) - Math.min(...xValues);
            const yVariance = Math.max(...yValues) - Math.min(...yValues);

            // 十分ズームインしているか、またはほぼ同一座標の場合はspiderfy表示
            const threshold = fullWidth * 0.001; // 画像幅の0.1%以下なら同一座標とみなす
            const shouldSpiderfy = (xVariance < threshold && yVariance < threshold) || currentZoom > 100;

            if (shouldSpiderfy) {
              // spiderfy表示に切り替え
              spiderfiedCluster.value = cluster.id;
              updateAnnotationDisplay();
            } else {
              // クラスターの場合はスムーズにズームイン
              const point = viewer.viewport.imageToViewportCoordinates(
                cluster.center[0],
                cluster.center[1]
              );

              // スムーズなアニメーションでズームイン
              viewer.viewport.zoomTo(currentZoom * 2, point, false);
              viewer.viewport.applyConstraints();
            }
          } else {
            // 単一の特徴の場合は選択
            const feature = cluster.features[0];
            const id = feature.id;

            removeSelected();
            setSelected(cluster.id);

            action.value = {
              type: "osd",
              id,
            };
          }
        },
      });
    }
  } else {
    // クラスタリングが無効な場合は通常表示
    // 表示範囲内のアノテーションのみをフィルタリング（回転を考慮して4隅をチェック）
    const bounds = viewer.viewport.getBounds();
    const corners = [
      viewer.viewport.viewportToImageCoordinates(bounds.x, bounds.y), // 左上
      viewer.viewport.viewportToImageCoordinates(bounds.x + bounds.width, bounds.y), // 右上
      viewer.viewport.viewportToImageCoordinates(bounds.x + bounds.width, bounds.y + bounds.height), // 右下
      viewer.viewport.viewportToImageCoordinates(bounds.x, bounds.y + bounds.height), // 左下
    ];

    // 4隅から最小・最大座標を取得（回転していても正確な範囲を取得）
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const corner of corners) {
      minX = Math.min(minX, corner.x);
      minY = Math.min(minY, corner.y);
      maxX = Math.max(maxX, corner.x);
      maxY = Math.max(maxY, corner.y);
    }

    // マージンを追加（表示範囲のサイズに基づいて動的に設定）
    const viewportWidth = maxX - minX;
    const viewportHeight = maxY - minY;

    // マージンは画像サイズに対する相対値で制限（画面幅に依存しないように）
    const maxMarginX = fullWidth * 0.4; // 画像幅の40%まで
    const maxMarginY = fullHeight * 0.4; // 画像高さの40%まで
    const marginX = Math.min(viewportWidth * 0.3, maxMarginX);
    const marginY = Math.min(viewportHeight * 0.3, maxMarginY);

    // マージンを適用
    minX = minX - marginX;
    minY = minY - marginY;
    maxX = maxX + marginX;
    maxY = maxY + marginY;

    // 画像範囲内にクリップ（回転時の座標変換の問題を回避）
    minX = Math.max(-fullWidth * 0.5, minX);
    maxX = Math.min(fullWidth * 1.5, maxX);
    minY = Math.max(-fullHeight * 0.5, minY);
    maxY = Math.min(fullHeight * 1.5, maxY);

    const visibleFeatures = allFeatures.filter((feature: any) => {
      if (!feature.properties?.resourceCoords || feature.properties.resourceCoords.length < 2) {
        return true; // xywh形式の場合は常に表示
      }
      const x = feature.properties.resourceCoords[0];
      const y = feature.properties.resourceCoords[1];
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });

    for (const feature of visibleFeatures) {
      const id = feature.id;

      if (!feature) {
        console.warn('Feature not found for id:', id);
        continue;
      }

      let overlay: any = null;

      if (feature.xywh) {
        // deprecated
        const xywh = feature.xywh.split(",");
        const x = Number(xywh[0]) / fullWidth;
        const y = Number(xywh[1]) / fullWidth;
        const width = Number(xywh[2]) / fullWidth;
        const height = Number(xywh[3]) / fullWidth;

        overlay = {
          id,
          x,
          y,
          width,
          height,
          className: "osdc-highlight osdc-base",
        };
      } else if (feature.metadata?.xywh) {
        const xywh = feature.metadata.xywh.split(",");
        const x = Number(xywh[0]) / fullWidth;
        const y = Number(xywh[1]) / fullWidth;
        const width = Number(xywh[2]) / fullWidth;
        const height = Number(xywh[3]) / fullWidth;

        overlay = {
          id,
          x,
          y,
          width,
          height,
          className: "osdc-highlight osdc-base",
        };
      } else if (feature.properties && feature.properties.resourceCoords && Array.isArray(feature.properties.resourceCoords) && feature.properties.resourceCoords.length >= 2) {
        const resourceCoords = feature.properties.resourceCoords;
        const x = Number(resourceCoords[0]) / fullWidth;
        const y = Number(resourceCoords[1]) / fullWidth;

        const overlay_ = document.createElement("div");
        overlay_.id = id;
        overlay_.className = "pin-icon";

        overlay = {
          id,
          x,
          y,
          placement: "RIGHT",
          checkResize: false,
          className: "pin-icon",
        };
      } else {
        console.warn('Feature missing required coordinate data:', id);
        continue;
      }

      if (overlay) {
        viewer.addOverlay(overlay);
      } else {
        console.warn('No overlay created for feature:', id);
        continue;
      }

      new $OpenSeadragon.MouseTracker({
        element: overlay.id,
        clickHandler: function (e: any) {
          if (e && e.originalTarget) {
            const id = e.originalTarget.id;

            removeSelected();

            setSelected(id);

            action.value = {
              type: "osd",
              id,
            };
          }
        },
      });
    }
  }
};

// URLパラメータから復元中かどうかのフラグ
const isRestoringFromURL = ref(false);

watch(
  () => showAnnotations.value,
  () => {
    if (!isRestoringFromURL.value) {
      updateURLParams();
    }
    updateAnnotationDisplay();
  }
);

// クラスタリング状態の変更を監視
watch(
  () => enableClustering.value,
  () => {
    updateAnnotationDisplay();
    if (!isRestoringFromURL.value) {
      updateURLParams();
    }
  }
);

// 自動回転（局所回転）状態の変更を監視
watch(
  () => autoRotateOnSelect.value,
  () => {
    if (!isRestoringFromURL.value) {
      updateURLParams();
    }
  }
);

function setSelected(id: string) {
  const e = document.getElementById(id);
  if (e) {
    if (e.classList.contains("pin-icon")) {
      e.classList.add("pin-selected");
    } else {
      e.classList.add("osdc-selected");
    }
    // e.classList.add("osdc-selected");
  }
}

function removeSelected() {
  const classList = ["pin-selected", "osdc-selected"];
  for (const className of classList) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element) {
        element.classList.remove(className);
      }
    }
  }
}

const update = () => {
  rotate.value = rotate2.value;
};

const init = () => {
  rotate.value = 0;
  rotate2.value = 0;
};

// 180度回転を追加
const rotate180 = () => {
  rotate.value += 180;
  rotate2.value += 180;
  // -180〜180の範囲に正規化
  if (rotate.value > 180) {
    rotate.value -= 360;
    rotate2.value -= 360;
  }
};

// 画像座標と地理座標から回転角度を計算
const calculateRotation = async () => {
  const features = Object.values(featuresMap.value);
  if (features.length < 2) {
    return;
  }

  // 計算中フラグを立てる
  isCalculatingRotation.value = true;

  try {
    // 次のフレームで計算を実行（UIの更新を先に反映させる）
    await nextTick();

    // 計算を非同期で実行
    const result = await new Promise<any>((resolve) => {
      setTimeout(() => {
        // 3点以上ある場合は分布パターンを使用、それ以外は2点間の角度を使用
        const calculatedResult = features.length >= 3
          ? calculateImageRotationAdvanced(features as any[])
          : calculateImageRotation(features as any[]);
        resolve(calculatedResult);
      }, 50); // UIが更新されるまで少し待つ
    });

    if (!result) {
      console.warn('Failed to calculate rotation');
      return;
    }

    if (typeof result.rotation !== 'number' || isNaN(result.rotation)) {
      console.warn('Invalid rotation result:', result.rotation);
      return;
    }

    rotate.value = result.rotation;
    rotate2.value = result.rotation;
  } finally {
    // 計算完了後にフラグを下げる
    isCalculatingRotation.value = false;
  }
};

// 選択したポイントの近接3点から局所的な回転を計算
const calculateLocalRotationOnSelect = async (selectedId: string) => {
  if (!autoRotateOnSelect.value) {
    return;
  }

  const allFeatures = Object.values(featuresMap.value);
  if (allFeatures.length < 2) {
    return;
  }

  const selectedFeature = featuresMap.value[selectedId];
  if (!selectedFeature || !selectedFeature.properties?.resourceCoords) {
    return;
  }

  const resourceCoords = selectedFeature.properties.resourceCoords;
  if (typeof resourceCoords[0] !== 'number' || typeof resourceCoords[1] !== 'number') {
    return;
  }

  try {
    // 選択したポイントの画像座標を取得
    const targetCoords: [number, number] = [
      resourceCoords[0],
      resourceCoords[1]
    ];

    // 最も近い3点を取得
    const nearestPoints = findNearestThreePoints(allFeatures as any[], targetCoords);

    if (nearestPoints.length < 2) {
      return;
    }

    // 局所的な回転角度を計算
    const result = calculateLocalRotation(nearestPoints);

    if (!result) {
      return;
    }

    if (typeof result.rotation !== 'number' || isNaN(result.rotation)) {
      return;
    }

    // 回転を適用
    rotate.value = result.rotation;
    rotate2.value = result.rotation;
  } catch (error) {
    console.error('Failed to calculate local rotation:', error);
  }
};

// 回転をリセット
const resetRotation = () => {
  rotate.value = 0;
  rotate2.value = 0;
  update();
};

// クラスタリング用の距離計算（画像座標での距離）
const calculateImageDistance = (coord1: number[], coord2: number[]) => {
  const dx = (coord1[0] ?? 0) - (coord2[0] ?? 0);
  const dy = (coord1[1] ?? 0) - (coord2[1] ?? 0);
  return Math.sqrt(dx * dx + dy * dy);
};

// グリッドベースの高速クラスタリング（O(n)）
const clusterFeatures = (features: any[], clusterRadius: number, zoomLevel: number = 1) => {
  if (features.length === 0) {
    return [];
  }

  // ズームレベルに応じてグリッドの粗さを調整
  // 引き（ズームアウト）の場合はより粗いグリッドで高速化
  let gridMultiplier: number;
  if (zoomLevel < 0.3) {
    // 非常に引きの場合: 5倍粗く（セル数1/25）
    gridMultiplier = 5;
  } else if (zoomLevel < 0.5) {
    // とても引きの場合: 4倍粗く（セル数1/16）
    gridMultiplier = 4;
  } else if (zoomLevel < 1) {
    // 引きの場合: 3倍粗く（セル数1/9）
    gridMultiplier = 3;
  } else if (zoomLevel < 2) {
    // 中程度: 2倍粗く（セル数1/4）
    gridMultiplier = 2;
  } else {
    // ズームイン時: 標準（細かいクラスタリング）
    gridMultiplier = 1;
  }

  const cellSize = clusterRadius * gridMultiplier;
  const grid: Map<string, any[]> = new Map();

  // 各特徴をグリッドセルに割り当て
  for (const feature of features) {
    if (!feature.properties?.resourceCoords || feature.properties.resourceCoords.length < 2) {
      continue;
    }

    const x = feature.properties.resourceCoords[0];
    const y = feature.properties.resourceCoords[1];

    // グリッドセルのインデックスを計算
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    const cellKey = `${cellX},${cellY}`;

    // このセルに特徴を追加
    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    grid.get(cellKey)!.push(feature);
  }

  // 各グリッドセルからクラスターを作成
  const clusters: any[] = [];
  for (const [cellKey, cellFeatures] of grid.entries()) {
    if (cellFeatures.length === 0) {
      continue;
    }

    // クラスターの中心を計算
    const sumX = cellFeatures.reduce((sum, f) => sum + (f.properties.resourceCoords[0] ?? 0), 0);
    const sumY = cellFeatures.reduce((sum, f) => sum + (f.properties.resourceCoords[1] ?? 0), 0);
    const center = [sumX / cellFeatures.length, sumY / cellFeatures.length];

    // クラスターIDは最初の特徴のIDを使用
    const clusterId = cellFeatures.length > 1
      ? `cluster-${cellKey}`
      : cellFeatures[0].id;

    clusters.push({
      id: clusterId,
      features: cellFeatures,
      center: center,
    });
  }

  return clusters;
};
</script>
<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="padding: 8px; flex: 0 0 auto">
      <!-- モバイルでは基本的なボタンのみ表示 -->
      <v-btn class="ma-1" size="small" icon id="previous">
        <v-icon>{{ mdiArrowLeft }}</v-icon>
      </v-btn>
      <v-btn class="ma-1" size="small" icon id="next">
        <v-icon>{{ mdiArrowRight }}</v-icon>
      </v-btn>
      
      <!-- デスクトップでのみ表示するボタン -->
      <template v-if="mdAndUp">
        <v-btn class="ma-1" size="small" icon id="zoom-in">
          <v-icon>{{ mdiPlus }}</v-icon>
        </v-btn>
        <v-btn class="ma-1" size="small" icon id="zoom-out">
          <v-icon>{{ mdiMinus }}</v-icon>
        </v-btn>
        <v-btn class="ma-1" size="small" icon id="home">
          <v-icon>{{ mdiHome }}</v-icon>
        </v-btn>
        <v-btn class="ma-1" size="small" icon id="full-page">
          <v-icon>{{ mdiFullscreen }}</v-icon>
        </v-btn>
        <!-- リセットボタンは回転ダイアログ内に統合
        <v-btn
          class="ma-1"
          size="small"
          icon
          @click="init()"
          :title="/*回転の初期化*/ $t('reset')"
        >
          <v-icon>{{ mdiRestore }}</v-icon>
        </v-btn>
        -->
        <!-- 自動回転ボタンは回転ダイアログ内に統合
        <v-btn
          class="ma-1"
          size="small"
          icon
          @click="calculateRotation()"
          :title="/*自動回転*/ $t('autoRotate')"
          color="secondary"
          :loading="isCalculatingRotation"
          :disabled="isCalculatingRotation"
        >
          <v-icon>{{ mdiAutoFix }}</v-icon>
        </v-btn>
        -->
      </template>

      <!-- アノテーション設定ボタン（モバイルでも表示） -->
      <v-btn
        class="ma-1"
        size="small"
        icon
        @click="showAnnotationDialog = true"
        :title="$t('annotation')"
      >
        <v-icon>{{ mdiMessage }}</v-icon>
      </v-btn>

      <!-- 回転角度調整ボタン -->
      <v-btn
        class="ma-1"
        size="small"
        icon
        @click="showRotationDialog = true"
        :title="/*角度*/ $t('angle')"
      >
        <v-icon>{{ mdiRotateRight }}</v-icon>
      </v-btn>

      <!-- 自動回転トグルボタン（局所回転） -->
      <!-- うまく動かなかったのでコメントアウト
      <v-btn
        class="ma-1"
        :color="autoRotateOnSelect ? 'success' : 'default'"
        size="small"
        icon
        @click="autoRotateOnSelect = !autoRotateOnSelect"
        :title="autoRotateOnSelect ? '選択時の局所回転: ON' : '選択時の局所回転: OFF'"
      >
        <v-icon>{{ mdiCrosshairsGps }}</v-icon>
        <v-badge
          v-if="autoRotateOnSelect"
          dot
          color="success"
          offset-x="-8"
          offset-y="-8"
        ></v-badge>
      </v-btn>
      -->

      <!-- クラスタリングトグルボタンはアノテーション設定ダイアログ内に統合 -->
      <!--
      <v-btn
        class="ma-1"
        :color="enableClustering ? 'success' : 'default'"
        size="small"
        icon
        @click="enableClustering = !enableClustering"
        :title="enableClustering ? 'クラスタリング: ON' : 'クラスタリング: OFF'"
      >
        <v-icon>{{ mdiShape }}</v-icon>
        <v-badge
          v-if="enableClustering"
          dot
          color="success"
          offset-x="-8"
          offset-y="-8"
        ></v-badge>
      </v-btn>
      -->
    </div>

    <div
      id="osd"
      :style="`flex-grow: 1; flex-basis: 0; background-color: #000000;`"
    ></div>

    <!-- 回転角度調整ダイアログ -->
    <v-dialog v-model="showRotationDialog" max-width="500">
      <v-card>
        <v-card-title>{{ $t('angle') }}</v-card-title>
        <v-card-text>
          <v-slider
            v-model="rotate2"
            :max="180"
            :step="1"
            :min="-180"
            hide-details
            class="mb-4"
            @update:modelValue="update()"
          >
            <template v-slot:prepend>
              <span style="width: 60px; text-align: right; display: inline-block;">{{ rotate2.toFixed(1) }}°</span>
            </template>
          </v-slider>

          <v-text-field
            v-model.number="rotate2"
            type="number"
            :label="$t('angle')"
            density="compact"
            hide-details
            variant="outlined"
            suffix="°"
            @update:modelValue="update()"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="warning"
            variant="outlined"
            @click="resetRotation"
            :title="$t('reset')"
          >
            <v-icon start>{{ mdiRotateLeft }}</v-icon>
            {{ $t('reset') }}
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            @click="calculateRotation()"
            :title="$t('autoRotate')"
            :loading="isCalculatingRotation"
            :disabled="isCalculatingRotation"
          >
            <v-icon start>{{ mdiAutoFix }}</v-icon>
            {{ $t('autoRotate') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="showRotationDialog = false">{{ $t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- アノテーション設定ダイアログ -->
    <v-dialog v-model="showAnnotationDialog" max-width="500">
      <v-card>
        <v-card-title>{{ $t('annotation') }}</v-card-title>
        <v-card-text>
          <!-- アノテーション表示/非表示 -->
          <v-switch
            v-model="showAnnotations"
            color="primary"
            :label="showAnnotations ? $t('annotation') + ': ON' : $t('annotation') + ': OFF'"
            hide-details
            class="mb-4"
          ></v-switch>

          <!-- クラスタリング設定 -->
          <v-switch
            v-model="enableClustering"
            color="success"
            :label="enableClustering ? 'クラスタリング: ON' : 'クラスタリング: OFF'"
            hide-details
            :disabled="!showAnnotations"
          ></v-switch>
          <p v-if="!showAnnotations" class="text-caption text-grey mt-2">
            アノテーションを表示するとクラスタリング設定が有効になります
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showAnnotationDialog = false">{{ $t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<style scoped>
:deep(.osdc-highlight) {
  outline: solid #03a9f4;
}

:deep(.osdc-selected) {
  outline: solid #ffeb3b !important;
  /* border: 2px solid #ffeb3b !important; */ /* アイコンの境界線 */
}

:deep(.pin-selected) {
  /* outline: solid #ffeb3b !important; */
  /* border: 2px solid #ffeb3b !important; */ /* アイコンの境界線 */
  background-color: #FF0000 !important; /* 選択時の色（MapLibre GLと統一） */
}

:deep(.osdc-hover) {
  outline: solid #9c27b0;
}

:deep(.osdc-base:hover, .osdc-base:focus) {
  outline: solid #9c27b0;
}
:deep(.pin-icon) {
  width: 16px; /* アイコンの幅（MapLibre GLと統一: radius 8 = 直径16px） */
  height: 16px; /* アイコンの高さ */
  background-color: #3FB1CE; /* アイコンの背景色（MapLibre GLと統一） */
  border: 1px solid #fff; /* アイコンの境界線（MapLibre GLと統一） */
  border-radius: 50%; /* 円形にする */
  box-shadow: 0 0 2px #333; /* 影をつける */

  /* アイコンを中央に配置するための設定 */
  display: flex;
  align-items: center;
  justify-content: center;

  /* ピンの先端部分を作成 */
  position: relative;
}

:deep(.cluster-icon) {
  width: 40px !important;
  height: 40px !important;
  background-color: #51bbd6;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: absolute !important;
  cursor: pointer;
  transform: translate(-50%, -50%);
  left: 50% !important;
  top: 50% !important;
}

:deep(.cluster-count) {
  color: #000; /* MapLibre GLと統一: 黒文字 */
  font-weight: bold;
  font-size: 14px;
  text-align: center;
  width: 100%;
  line-height: 1;
  user-select: none;
  display: block;
  /* MapLibre GLと統一: 文字の周りに白い縁 */
  text-shadow:
    -1px -1px 0 #fff,
     1px -1px 0 #fff,
    -1px  1px 0 #fff,
     1px  1px 0 #fff;
}

/* Spiderfy関連のスタイル */
:deep(.spiderfy-center) {
  width: 8px;
  height: 8px;
  background-color: #888;
  border: 1px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 2px #000;
  position: absolute;
  transform: translate(-50%, -50%);
}

:deep(.spiderfy-line) {
  pointer-events: none;
  z-index: 0;
}

:deep(.spiderfy-marker) {
  z-index: 1;
  cursor: pointer;
  transition: transform 0.2s ease;
}

:deep(.spiderfy-marker:hover) {
  transform: scale(1.3);
}
</style>
