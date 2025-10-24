// Helper function to convert Web Mercator tile coordinates to lat/lng
function tile2lng(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export default defineEventHandler(async (event) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[IIIF Tile ${requestId}] Request started`);

  // Parse path: /api/iiif-tile/{imageServiceId}/{tileSize}/{minLng}/{minLat}/{maxLng}/{maxLat}/{imageWidth}/{imageHeight}/{z}/{x}/{y}
  const path = event.context.params?.path || '';

  if (!path) {
    console.log(`[IIIF Tile ${requestId}] ERROR: Missing tile path`);
    throw createError({
      statusCode: 400,
      message: 'Missing tile path'
    });
  }

  const parts = path.split('/');
  console.log(`[IIIF Tile ${requestId}] Path parts count: ${parts.length}`);

  if (parts.length < 11) {
    console.log(`[IIIF Tile ${requestId}] ERROR: Invalid path format, expected >=11 parts, got ${parts.length}`);
    throw createError({
      statusCode: 400,
      message: 'Invalid tile path format'
    });
  }

  // Extract parameters from the end
  const yStr = parts[parts.length - 1];
  const xStr = parts[parts.length - 2];
  const zStr = parts[parts.length - 3];
  const imageHeightStr = parts[parts.length - 4];
  const imageWidthStr = parts[parts.length - 5];
  const maxLatStr = parts[parts.length - 6];
  const maxLngStr = parts[parts.length - 7];
  const minLatStr = parts[parts.length - 8];
  const minLngStr = parts[parts.length - 9];
  const tileSizeStr = parts[parts.length - 10];

  // Everything before is the image service ID
  const imageServiceId = decodeURIComponent(parts.slice(0, -10).join('/'));

  if (!tileSizeStr || !zStr || !xStr || !yStr || !minLngStr || !minLatStr || !maxLngStr || !maxLatStr || !imageWidthStr || !imageHeightStr) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters'
    });
  }

  const tileSize = parseInt(tileSizeStr);
  const z = parseInt(zStr);
  const x = parseInt(xStr);
  const y = parseInt(yStr);
  const minLng = parseFloat(minLngStr);
  const minLat = parseFloat(minLatStr);
  const maxLng = parseFloat(maxLngStr);
  const maxLat = parseFloat(maxLatStr);
  const imageWidth = parseInt(imageWidthStr);
  const imageHeight = parseInt(imageHeightStr);

  if (isNaN(tileSize) || isNaN(z) || isNaN(x) || isNaN(y) ||
      isNaN(minLng) || isNaN(minLat) || isNaN(maxLng) || isNaN(maxLat) ||
      isNaN(imageWidth) || isNaN(imageHeight)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid parameters'
    });
  }

  console.log(`[IIIF Tile ${requestId}] Parsed:`, { imageServiceId, tileSize, z, x, y, bounds: [minLng, minLat, maxLng, maxLat], imageDims: [imageWidth, imageHeight] });

  try {
    // Calculate the geographic bounds of this tile
    const tileLngMin = tile2lng(x, z);
    const tileLngMax = tile2lng(x + 1, z);
    const tileLatMax = tile2lat(y, z);
    const tileLatMin = tile2lat(y + 1, z);

    console.log(`[IIIF Tile ${requestId}] Tile geo bounds:`, { tileLngMin, tileLatMin, tileLngMax, tileLatMax });

    // Convert geographic coordinates to image pixel coordinates using linear interpolation
    // This assumes the image bounds are georeferenced
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;

    // Calculate the pixel coordinates for this tile's geographic bounds
    // Note: Image Y coordinates increase downward, lat increases upward
    const pixelXMin = Math.floor(((tileLngMin - minLng) / lngRange) * imageWidth);
    const pixelXMax = Math.ceil(((tileLngMax - minLng) / lngRange) * imageWidth);
    const pixelYMin = Math.floor(((maxLat - tileLatMax) / latRange) * imageHeight);
    const pixelYMax = Math.ceil(((maxLat - tileLatMin) / latRange) * imageHeight);

    console.log(`[IIIF Tile ${requestId}] Pixel bounds:`, { pixelXMin, pixelYMin, pixelXMax, pixelYMax });

    const regionX = Math.max(0, pixelXMin);
    const regionY = Math.max(0, pixelYMin);
    const regionXEnd = Math.min(imageWidth, pixelXMax);
    const regionYEnd = Math.min(imageHeight, pixelYMax);

    const regionW = regionXEnd - regionX;
    const regionH = regionYEnd - regionY;

    // Check if tile is completely outside image bounds or has invalid dimensions
    if (regionX >= imageWidth || regionY >= imageHeight || regionW <= 0 || regionH <= 0) {
      console.log(`[IIIF Tile ${requestId}] Tile outside image bounds or invalid:`, { z, x, y, regionX, regionY, regionW, regionH });
      // Return a 1x1 transparent PNG
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = event.node.res;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', transparentPng.length.toString());
      res.end(transparentPng);
      return;
    }

    // Build IIIF Image API URL
    // Request the region at the tile size (256px typically)
    const region = `${regionX},${regionY},${regionW},${regionH}`;
    const size = `${tileSize},`;
    const iiifUrl = `${imageServiceId}/${region}/${size}/0/default.jpg`;

    console.log(`[IIIF Tile ${requestId}] Fetching IIIF:`, { z, x, y, region, size: `${tileSize}px`, iiifUrl });

    // Fetch the tile image
    const fetchStart = Date.now();
    const response = await fetch(iiifUrl);
    const fetchDuration = Date.now() - fetchStart;

    console.log(`[IIIF Tile ${requestId}] IIIF response received in ${fetchDuration}ms:`, { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      console.error(`[IIIF Tile ${requestId}] IIIF server error:`, response.status, response.statusText, 'for', iiifUrl);
      // Return transparent PNG instead of throwing error
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = event.node.res;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', transparentPng.length.toString());
      res.end(transparentPng);
      return;
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`[IIIF Tile ${requestId}] Sending response:`, {
      contentType,
      size: imageBuffer.byteLength,
      z, x, y
    });

    // Use Node.js response object directly for binary data
    const res = event.node.res;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('Content-Length', imageBuffer.byteLength.toString());

    // Write the buffer directly and end the response
    res.end(Buffer.from(imageBuffer));
    console.log(`[IIIF Tile ${requestId}] Response sent successfully`);
  } catch (error: any) {
    console.error(`[IIIF Tile ${requestId}] Error:`, error.message, error.stack);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch IIIF tile: ${error.message}`
    });
  }
});
