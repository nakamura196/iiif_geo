export default defineEventHandler(async (event) => {
  // Get the IIIF image URL from query parameters
  const query = getQuery(event);
  const url = query.url as string;

  console.log('[IIIF Proxy] Requested URL:', url);

  if (!url) {
    console.error('[IIIF Proxy] No URL parameter provided');
    throw createError({
      statusCode: 400,
      message: 'URL parameter is required'
    });
  }

  try {
    // Fetch the image from the IIIF server
    console.log('[IIIF Proxy] Fetching from IIIF server...');
    const response = await fetch(url);

    console.log('[IIIF Proxy] Response status:', response.status);
    console.log('[IIIF Proxy] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('[IIIF Proxy] IIIF server returned error:', response.status, response.statusText);
      throw createError({
        statusCode: response.status,
        message: `Failed to fetch image: ${response.statusText}`
      });
    }

    // Get the image data as ArrayBuffer
    const imageBuffer = await response.arrayBuffer();
    console.log('[IIIF Proxy] Image buffer size:', imageBuffer.byteLength);

    // Get content type from the original response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Use Node.js response object directly for binary data
    const res = event.node.res;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Length', imageBuffer.byteLength.toString());

    console.log('[IIIF Proxy] Sending binary data');

    // Write the buffer directly and end the response
    res.end(Buffer.from(imageBuffer));
  } catch (error: any) {
    console.error('[IIIF Proxy] Error:', error.message, error.stack);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch IIIF image: ${error.message}`
    });
  }
});
