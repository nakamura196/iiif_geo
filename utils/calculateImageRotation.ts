// 画像座標と地理座標から回転角度を計算するユーティリティ関数

import { estimateRotation, type Point2D } from '~/utils/rotation';

export interface Feature {
  properties?: {
    resourceCoords?: number[];
    [key: string]: any;
  };
  geometry?: {
    coordinates?: number[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface ValidFeature {
  properties: {
    resourceCoords: [number, number, ...number[]];
    [key: string]: any;
  };
  geometry: {
    coordinates: [number, number, ...number[]];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface RotationCalculationResult {
  rotation: number;
  debug?: {
    feature1: { img: { x: number; y: number }; geo: { lng: number; lat: number } };
    feature2: { img: { x: number; y: number }; geo: { lng: number; lat: number } };
    imgVector: { x: number; y: number };
    geoVector: { x: number; y: number };
    imgAngleDeg: number;
    geoAngleFromNorthDeg: number;
  };
}

function isValidFeature(feature: Feature): feature is ValidFeature {
  return !!(
    feature.properties?.resourceCoords &&
    Array.isArray(feature.properties.resourceCoords) &&
    feature.properties.resourceCoords.length >= 2 &&
    typeof feature.properties.resourceCoords[0] === 'number' &&
    typeof feature.properties.resourceCoords[1] === 'number' &&
    feature.geometry?.coordinates &&
    Array.isArray(feature.geometry.coordinates) &&
    feature.geometry.coordinates.length >= 2 &&
    typeof feature.geometry.coordinates[0] === 'number' &&
    typeof feature.geometry.coordinates[1] === 'number'
  );
}

/**
 * 画像座標と地理座標の対応点から、画像を北が上になるように回転させる角度を計算
 * 2点間の方法（最も離れた2点を使用）
 * @param features - 対応点の配列
 * @returns 回転角度（度）とデバッグ情報
 */
export function calculateImageRotation(features: Feature[]): RotationCalculationResult | null {
  const validFeatures: ValidFeature[] = features.filter(isValidFeature);

  if (validFeatures.length < 2) {
    return null;
  }

  // 最も離れた2点を見つける（高速化版）
  let maxDistance = 0;
  let feature1: ValidFeature = validFeatures[0]!;
  let feature2: ValidFeature = validFeatures[1]!;

  // ポイント数が多い場合はサンプリング
  const shouldSample = validFeatures.length > 100;
  const sampleSize = shouldSample ? Math.min(100, validFeatures.length) : validFeatures.length;

  if (shouldSample) {
    const step = Math.floor(validFeatures.length / sampleSize);
    for (let i = 0; i < validFeatures.length; i += step) {
      for (let j = i + step; j < validFeatures.length; j += step) {
        const f1 = validFeatures[i]!;
        const f2 = validFeatures[j]!;

        const dx = f2.properties.resourceCoords[0] - f1.properties.resourceCoords[0];
        const dy = f2.properties.resourceCoords[1] - f1.properties.resourceCoords[1];
        const distance = dx * dx + dy * dy;
        if (distance > maxDistance) {
          maxDistance = distance;
          feature1 = f1;
          feature2 = f2;
        }
      }
    }
  } else {
    for (let i = 0; i < validFeatures.length; i++) {
      for (let j = i + 1; j < validFeatures.length; j++) {
        const f1 = validFeatures[i]!;
        const f2 = validFeatures[j]!;

        const dx = f2.properties.resourceCoords[0] - f1.properties.resourceCoords[0];
        const dy = f2.properties.resourceCoords[1] - f1.properties.resourceCoords[1];
        const distance = dx * dx + dy * dy;
        if (distance > maxDistance) {
          maxDistance = distance;
          feature1 = f1;
          feature2 = f2;
        }
      }
    }
  }

  const img1 = {
    x: feature1.properties.resourceCoords[0],
    y: feature1.properties.resourceCoords[1]
  };
  const img2 = {
    x: feature2.properties.resourceCoords[0],
    y: feature2.properties.resourceCoords[1]
  };

  const geo1 = {
    lng: feature1.geometry.coordinates[0],
    lat: feature1.geometry.coordinates[1]
  };
  const geo2 = {
    lng: feature2.geometry.coordinates[0],
    lat: feature2.geometry.coordinates[1]
  };

  const imgVector = {
    x: img2.x - img1.x,
    y: img2.y - img1.y
  };

  const avgLat = (geo1.lat + geo2.lat) / 2;
  const cosLat = Math.cos(avgLat * Math.PI / 180);

  const geoVector = {
    x: (geo2.lng - geo1.lng) * cosLat,
    y: geo2.lat - geo1.lat
  };

  const imgAngle = Math.atan2(imgVector.y, imgVector.x);
  const geoAngleFromEast = Math.atan2(geoVector.y, geoVector.x);
  const geoAngleFromNorth = geoAngleFromEast - Math.PI / 2;

  let rotationRad = geoAngleFromNorth - imgAngle;
  let rotation = rotationRad * 180 / Math.PI;

  while (rotation > 180) rotation -= 360;
  while (rotation < -180) rotation += 360;

  return {
    rotation,
    debug: {
      feature1: { img: img1, geo: geo1 },
      feature2: { img: img2, geo: geo2 },
      imgVector,
      geoVector,
      imgAngleDeg: imgAngle * 180 / Math.PI,
      geoAngleFromNorthDeg: geoAngleFromNorth * 180 / Math.PI,
    }
  };
}

/**
 * 全対応点を使用した最小二乗法による回転角度推定
 * @param features - 対応点の配列
 * @returns 回転角度（度）とデバッグ情報
 */
export function calculateImageRotationFromDistribution(features: Feature[]): RotationCalculationResult | null {
  const validFeatures: ValidFeature[] = features.filter(isValidFeature);

  if (validFeatures.length < 2) {
    return null;
  }

  if (validFeatures.length < 3) {
    return calculateImageRotation(features);
  }

  // 地理座標の中心を計算（緯度補正用）
  const geoCenter = {
    lat: validFeatures.reduce((sum, f) => sum + f.geometry.coordinates[1], 0) / validFeatures.length,
    lng: validFeatures.reduce((sum, f) => sum + f.geometry.coordinates[0], 0) / validFeatures.length
  };
  const cosLat = Math.cos(geoCenter.lat * Math.PI / 180);

  // 画像座標点群を作成
  const imagePoints: Point2D[] = validFeatures.map(f => ({
    x: f.properties.resourceCoords[0],
    y: f.properties.resourceCoords[1]
  }));

  // 地理座標点群を作成（緯度補正済み）
  const geoPoints: Point2D[] = validFeatures.map(f => ({
    x: f.geometry.coordinates[0] * cosLat,
    y: f.geometry.coordinates[1]
  }));

  // 最小二乗法で回転角度を推定
  const result = estimateRotation(imagePoints, geoPoints, { flipSourceY: true });

  if (!result) {
    return calculateImageRotation(features);
  }

  return {
    rotation: result.rotation,
    debug: {
      feature1: { img: { x: 0, y: 0 }, geo: { lng: geoCenter.lng, lat: geoCenter.lat } },
      feature2: { img: { x: 0, y: 0 }, geo: { lng: 0, lat: 0 } },
      imgVector: { x: 0, y: 0 },
      geoVector: { x: 0, y: 0 },
      imgAngleDeg: 0,
      geoAngleFromNorthDeg: result.rotation,
    }
  };
}

/**
 * より高度な回転計算
 * 全対応点を使用した最小二乗法
 */
export function calculateImageRotationAdvanced(features: Feature[]): RotationCalculationResult | null {
  return calculateImageRotationFromDistribution(features);
}

/**
 * 指定した座標に最も近い3点を取得
 * @param features - すべての特徴点
 * @param targetCoords - 基準となる画像座標 [x, y]
 * @returns 最も近い3点の配列
 */
export function findNearestThreePoints(features: Feature[], targetCoords: [number, number]): ValidFeature[] {
  const validFeatures: ValidFeature[] = features.filter(isValidFeature);

  if (validFeatures.length < 3) {
    return validFeatures;
  }

  const distances = validFeatures.map(feature => {
    const dx = feature.properties.resourceCoords[0] - targetCoords[0];
    const dy = feature.properties.resourceCoords[1] - targetCoords[1];
    return {
      feature,
      distance: dx * dx + dy * dy
    };
  });

  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, 3).map(d => d.feature);
}

/**
 * 局所的な回転角度を計算（3点から）
 * @param features - 3点の特徴点
 * @returns 回転角度（度）
 */
export function calculateLocalRotation(features: Feature[]): RotationCalculationResult | null {
  const validFeatures: ValidFeature[] = features.filter(isValidFeature);

  if (validFeatures.length < 2) {
    return null;
  }

  if (validFeatures.length === 3) {
    let maxDistance = 0;
    let feature1: ValidFeature = validFeatures[0]!;
    let feature2: ValidFeature = validFeatures[1]!;

    for (let i = 0; i < validFeatures.length; i++) {
      for (let j = i + 1; j < validFeatures.length; j++) {
        const f1 = validFeatures[i]!;
        const f2 = validFeatures[j]!;

        const dx = f2.properties.resourceCoords[0] - f1.properties.resourceCoords[0];
        const dy = f2.properties.resourceCoords[1] - f1.properties.resourceCoords[1];
        const distance = dx * dx + dy * dy;
        if (distance > maxDistance) {
          maxDistance = distance;
          feature1 = f1;
          feature2 = f2;
        }
      }
    }

    return calculateImageRotation([feature1, feature2]);
  }

  return calculateImageRotation(validFeatures);
}
