// Cloudflare Pages Functions Middleware
// This ensures static assets are served correctly and SPA routing works

// Helper function to get correct MIME type
function getMimeType(pathname) {
  if (pathname.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (pathname.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (pathname.endsWith('.css')) return 'text/css; charset=utf-8';
  if (pathname.endsWith('.json')) return 'application/json; charset=utf-8';
  if (pathname.endsWith('.html')) return 'text/html; charset=utf-8';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  if (pathname.endsWith('.woff')) return 'font/woff';
  if (pathname.endsWith('.woff2')) return 'font/woff2';
  if (pathname.endsWith('.ttf')) return 'font/ttf';
  return null;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // List of static file extensions and paths that should be served directly
  const staticPatterns = [
    /^\/assets\//,
    /^\/icons\//,
    /^\/legal\//,
    /\.js$/,
    /\.mjs$/,
    /\.css$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.webp$/,
    /\.svg$/,
    /\.ico$/,
    /\.woff2?$/,
    /\.ttf$/,
    /^\/manifest\.json$/,
    /^\/robots\.txt$/,
    /^\/sw\.js$/,
    /^\/workbox-.*\.js$/,
    /^\/notificationHelper\.js$/,
    /^\/clear-cache\.html$/,
    /^\/fix-cache\.js$/,
  ];

  // Check if the request is for a static asset
  const isStaticAsset = staticPatterns.some(pattern => pattern.test(pathname));

  if (isStaticAsset) {
    // Serve the static asset directly with correct MIME type
    const response = await next();

    // Get the correct MIME type
    const mimeType = getMimeType(pathname);

    // If we have a MIME type and the response doesn't have the correct Content-Type, fix it
    if (mimeType) {
      const headers = new Headers(response.headers);

      // Only set Content-Type if it's missing or incorrect
      const currentContentType = headers.get('Content-Type');
      if (!currentContentType || currentContentType.includes('text/html')) {
        headers.set('Content-Type', mimeType);
      }

      // Ensure X-Content-Type-Options is set
      headers.set('X-Content-Type-Options', 'nosniff');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    }

    return response;
  }

  // For all other requests (SPA routes), serve index.html
  // This allows React Router to handle the routing
  try {
    const response = await next();

    // If the response is a 404, serve index.html instead (SPA fallback)
    if (response.status === 404) {
      // Fetch index.html from the assets
      const indexUrl = new URL('/index.html', request.url);
      const indexResponse = await fetch(indexUrl);

      return new Response(indexResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return response;
  } catch (error) {
    // If there's an error, try to serve index.html
    const indexUrl = new URL('/index.html', request.url);
    const indexResponse = await fetch(indexUrl);

    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

