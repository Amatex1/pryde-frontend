// Cloudflare Pages Functions Middleware
// This ensures static assets are served correctly and SPA routing works

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // List of static file extensions and paths that should be served directly
  const staticPatterns = [
    /^\/assets\//,
    /^\/icons\//,
    /^\/legal\//,
    /\.js$/,
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
    // Serve the static asset directly
    return next();
  }

  // For all other requests (SPA routes), serve index.html
  // This allows React Router to handle the routing
  const response = await next();
  
  // If the response is a 404, serve index.html instead (SPA fallback)
  if (response.status === 404) {
    const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
    return new Response(indexResponse.body, {
      ...indexResponse,
      status: 200,
      headers: {
        ...Object.fromEntries(indexResponse.headers),
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  return response;
}

