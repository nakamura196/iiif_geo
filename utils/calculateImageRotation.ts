// 画像座標と地理座標から回転角度を計算するユーティリティ関数

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
 * @param features - 対応点の配列
 * @returns 回転角度（度）とデバッグ情報
 */
export function calculateImageRotation(features: Feature[]): RotationCalculationResult | null {
  // すべての特徴点を配列に変換
  const validFeatures: ValidFeature[] = features.filter(isValidFeature);
  
  if (validFeatures.length < 2) {
    return null;
  }
  
  // 最も離れた2点を見つける（より正確な角度計算のため）
  let maxDistance = 0;
  let feature1: ValidFeature = validFeatures[0]!;
  let feature2: ValidFeature = validFeatures[1]!;
  
  for (let i = 0; i < validFeatures.length; i++) {
    for (let j = i + 1; j < validFeatures.length; j++) {
      const f1 = validFeatures[i]!;
      const f2 = validFeatures[j]!;
      
      const dx = f2.properties.resourceCoords[0] - f1.properties.resourceCoords[0];
      const dy = f2.properties.resourceCoords[1] - f1.properties.resourceCoords[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > maxDistance) {
        maxDistance = distance;
        feature1 = f1;
        feature2 = f2;
      }
    }
  }
  
  // 画像座標系での2点
  const img1 = {
    x: feature1.properties.resourceCoords[0],
    y: feature1.properties.resourceCoords[1]
  };
  const img2 = {
    x: feature2.properties.resourceCoords[0],
    y: feature2.properties.resourceCoords[1]
  };
  
  // 地理座標系での2点（経度、緯度）
  const geo1 = {
    lng: feature1.geometry.coordinates[0],
    lat: feature1.geometry.coordinates[1]
  };
  const geo2 = {
    lng: feature2.geometry.coordinates[0],
    lat: feature2.geometry.coordinates[1]
  };
  
  // 画像座標系でのベクトル（右がX正、下がY正）
  const imgVector = {
    x: img2.x - img1.x,
    y: img2.y - img1.y
  };
  
  // 地理座標系でのベクトル（東がX正、北がY正）
  // 中間緯度での経度1度あたりの距離を考慮
  const avgLat = (geo1.lat + geo2.lat) / 2;
  const cosLat = Math.cos(avgLat * Math.PI / 180);
  
  const geoVector = {
    x: (geo2.lng - geo1.lng) * cosLat,  // 経度差に緯度による補正
    y: geo2.lat - geo1.lat               // 緯度差
  };
  
  // 各座標系での角度を計算
  // 画像：右を0度として反時計回り（数学的な角度）
  const imgAngle = Math.atan2(imgVector.y, imgVector.x);
  
  // 地理：東を0度として反時計回り、これを北を0度に変換
  const geoAngleFromEast = Math.atan2(geoVector.y, geoVector.x);
  const geoAngleFromNorth = geoAngleFromEast - Math.PI / 2;
  
  // 回転角度 = 地理座標系での角度（北基準） - 画像座標系での角度
  let rotationRad = geoAngleFromNorth - imgAngle;
  
  // ラジアンから度に変換
  let rotation = rotationRad * 180 / Math.PI;
  
  // -180〜180の範囲に正規化
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
 * 主成分分析（PCA）を使用してマーカーの分布から主軸を計算
 */
function calculatePrincipalAxis(points: { x: number; y: number }[]): { angle: number; eigenValue1: number; eigenValue2: number } {
  // 重心を計算
  const n = points.length;
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / n,
    y: points.reduce((sum, p) => sum + p.y, 0) / n
  };

  // 共分散行列の要素を計算
  let cxx = 0, cyy = 0, cxy = 0;
  for (const p of points) {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  }
  cxx /= n;
  cyy /= n;
  cxy /= n;

  // 固有値を計算
  const trace = cxx + cyy;
  const det = cxx * cyy - cxy * cxy;
  const discriminant = Math.sqrt(trace * trace - 4 * det);
  const eigenValue1 = (trace + discriminant) / 2;
  const eigenValue2 = (trace - discriminant) / 2;

  // 第一主成分（最大固有値に対応する固有ベクトル）の角度を計算
  let angle;
  if (Math.abs(cxy) < 1e-10) {
    angle = cxx > cyy ? 0 : Math.PI / 2;
  } else {
    // 固有ベクトルの角度
    angle = Math.atan2(eigenValue1 - cxx, cxy);
  }

  return { angle, eigenValue1, eigenValue2 };
}

/**
 * マーカーの分布パターンから画像の回転角度を推定
 * @param features - 対応点の配列
 * @returns 回転角度（度）とデバッグ情報
 */
export function calculateImageRotationFromDistribution(features: Feature[]): RotationCalculationResult | null {
  const validFeatures: ValidFeature[] = features.filter(isValidFeature);
  
  if (validFeatures.length < 3) {
    return calculateImageRotation(features); // フォールバック
  }

  // 画像座標の点群
  const imagePoints = validFeatures.map(f => ({
    x: f.properties.resourceCoords[0],
    y: f.properties.resourceCoords[1]
  }));

  // 地理座標の点群（緯度経度を平面に投影）
  const geoCenter = {
    lat: validFeatures.reduce((sum, f) => sum + f.geometry.coordinates[1], 0) / validFeatures.length,
    lng: validFeatures.reduce((sum, f) => sum + f.geometry.coordinates[0], 0) / validFeatures.length
  };
  
  const cosLat = Math.cos(geoCenter.lat * Math.PI / 180);
  const geoPoints = validFeatures.map(f => ({
    x: (f.geometry.coordinates[0] - geoCenter.lng) * cosLat * 111000, // 経度 → X（東向き正）
    y: (f.geometry.coordinates[1] - geoCenter.lat) * 111000  // 緯度 → Y（北向き正）
  }));

  // 各点群の主軸を計算
  const imagePCA = calculatePrincipalAxis(imagePoints);
  const geoPCA = calculatePrincipalAxis(geoPoints);

  // 分布の形状が線形に近いかチェック（固有値の比率）
  const imageLinearity = imagePCA.eigenValue1 / (imagePCA.eigenValue2 + 1e-10);
  const geoLinearity = geoPCA.eigenValue1 / (geoPCA.eigenValue2 + 1e-10);

  // 両方の分布が十分に線形でない場合は、2点間の方法にフォールバック
  if (imageLinearity < 3 || geoLinearity < 3) {
    return calculateImageRotation(features);
  }

  // 画像の主軸角度（右を0度として反時計回り）
  const imageAngle = imagePCA.angle;
  
  // 地理の主軸角度（東を0度として計算されている）
  // 北を0度にするには90度回転が必要だが、PCAの角度は主軸なので180度の曖昧性がある
  const geoAngleFromEast = geoPCA.angle;
  
  // 画像の主軸角度と地理の主軸角度の差を計算
  // 注意: PCAの主軸は方向を持たない（±180度の曖昧性がある）
  let rotation = (geoAngleFromEast - imageAngle) * 180 / Math.PI;

  // 180度の曖昧性を解決
  // 地図は常に北が上なので、最も北にある点と最も南にある点を使用
  
  // 最も北（緯度が最大）の点と最も南（緯度が最小）の点を見つける
  let northIdx = 0, southIdx = 0;
  let maxLat = validFeatures[0]!.geometry.coordinates[1];
  let minLat = validFeatures[0]!.geometry.coordinates[1];
  
  for (let i = 1; i < validFeatures.length; i++) {
    const lat = validFeatures[i]!.geometry.coordinates[1];
    if (lat > maxLat) {
      maxLat = lat;
      northIdx = i;
    }
    if (lat < minLat) {
      minLat = lat;
      southIdx = i;
    }
  }
  
  // 北と南が同じ点の場合は、東西で判断
  if (northIdx === southIdx) {
    let eastIdx = 0, westIdx = 0;
    let maxLng = validFeatures[0]!.geometry.coordinates[0];
    let minLng = validFeatures[0]!.geometry.coordinates[0];
    
    for (let i = 1; i < validFeatures.length; i++) {
      const lng = validFeatures[i]!.geometry.coordinates[0];
      if (lng > maxLng) {
        maxLng = lng;
        eastIdx = i;
      }
      if (lng < minLng) {
        minLng = lng;
        westIdx = i;
      }
    }
    northIdx = eastIdx;
    southIdx = westIdx;
  }
  
  // 画像上での北の点と南の点の位置関係
  const northImgPoint = imagePoints[northIdx];
  const southImgPoint = imagePoints[southIdx];
  
  if (!northImgPoint || !southImgPoint) {
    console.error('Failed to get image points for north/south indices');
    return null;
  }
  
  // 回転後の画像で、北の点が南の点より上（Y座標が小さい）にあるべき
  // 現在の回転角度で北の点と南の点の位置を計算
  const rotRad = rotation * Math.PI / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);
  
  // 回転後の北の点のY座標
  const northRotY = -northImgPoint.x * sinR + northImgPoint.y * cosR;
  // 回転後の南の点のY座標
  const southRotY = -southImgPoint.x * sinR + southImgPoint.y * cosR;
  
  // 北の点が南の点より下にある場合（画像座標系は下が正）、180度回転が必要
  if (northRotY > southRotY) {
    rotation += 180;
  }

  // -180〜180の範囲に正規化
  while (rotation > 180) rotation -= 360;
  while (rotation < -180) rotation += 360;

  return {
    rotation,
    debug: {
      feature1: { img: { x: 0, y: 0 }, geo: { lng: 0, lat: 0 } },
      feature2: { img: { x: 0, y: 0 }, geo: { lng: 0, lat: 0 } },
      imgVector: { x: Math.cos(imageAngle), y: Math.sin(imageAngle) },
      geoVector: { x: Math.cos(geoAngleFromEast), y: Math.sin(geoAngleFromEast) },
      imgAngleDeg: imageAngle * 180 / Math.PI,
      geoAngleFromNorthDeg: geoAngleFromEast * 180 / Math.PI,
    }
  };
}

/**
 * より高度な回転計算
 * マーカーの分布パターンを使用して回転角度を推定
 */
export function calculateImageRotationAdvanced(features: Feature[]): RotationCalculationResult | null {
  return calculateImageRotationFromDistribution(features);
}