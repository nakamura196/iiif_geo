/**
 * 2D座標点群間の回転角度を最小二乗法で推定するライブラリ
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface RotationEstimationResult {
  /** 回転角度（度） */
  rotation: number;
  /** 回転角度（ラジアン） */
  rotationRad: number;
  /** 使用した点の数 */
  pointCount: number;
}

/**
 * 2つの点群間の最適な回転角度を最小二乗法で推定
 * Procrustes解析に基づく手法
 *
 * @param sourcePoints - 変換元の点群
 * @param targetPoints - 変換先の点群（sourcePointsと同じ順序で対応）
 * @param options - オプション
 * @returns 回転角度の推定結果
 */
export function estimateRotation(
  sourcePoints: Point2D[],
  targetPoints: Point2D[],
  options: {
    /** sourceのY軸を反転するか（画像座標系の場合true） */
    flipSourceY?: boolean;
  } = {}
): RotationEstimationResult | null {
  const { flipSourceY = false } = options;

  if (sourcePoints.length !== targetPoints.length) {
    console.error('Point arrays must have the same length');
    return null;
  }

  if (sourcePoints.length < 2) {
    console.error('At least 2 points are required');
    return null;
  }

  const n = sourcePoints.length;

  // 重心を計算
  const sourceCentroid = { x: 0, y: 0 };
  const targetCentroid = { x: 0, y: 0 };

  for (let i = 0; i < n; i++) {
    sourceCentroid.x += sourcePoints[i]!.x;
    sourceCentroid.y += sourcePoints[i]!.y;
    targetCentroid.x += targetPoints[i]!.x;
    targetCentroid.y += targetPoints[i]!.y;
  }

  sourceCentroid.x /= n;
  sourceCentroid.y /= n;
  targetCentroid.x /= n;
  targetCentroid.y /= n;

  // 最小二乗法で回転角度を推定
  // 重心を引いた座標で、外積と内積の総和から角度を計算
  let sumCross = 0;
  let sumDot = 0;

  for (let i = 0; i < n; i++) {
    const srcX = sourcePoints[i]!.x - sourceCentroid.x;
    const srcY = flipSourceY
      ? -(sourcePoints[i]!.y - sourceCentroid.y)
      : sourcePoints[i]!.y - sourceCentroid.y;
    const tgtX = targetPoints[i]!.x - targetCentroid.x;
    const tgtY = targetPoints[i]!.y - targetCentroid.y;

    // 外積: srcX * tgtY - srcY * tgtX
    // 内積: srcX * tgtX + srcY * tgtY
    sumCross += srcX * tgtY - srcY * tgtX;
    sumDot += srcX * tgtX + srcY * tgtY;
  }

  // atan2で回転角度を計算
  const rotationRad = Math.atan2(sumCross, sumDot);
  let rotation = rotationRad * 180 / Math.PI;

  // -180〜180の範囲に正規化
  while (rotation > 180) rotation -= 360;
  while (rotation < -180) rotation += 360;

  return {
    rotation,
    rotationRad,
    pointCount: n
  };
}

/**
 * 角度を-180〜180度の範囲に正規化
 */
export function normalizeAngle(degrees: number): number {
  let angle = degrees;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/**
 * 度からラジアンに変換
 */
export function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * ラジアンから度に変換
 */
export function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}
