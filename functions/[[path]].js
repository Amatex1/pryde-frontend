// Cloudflare Pages Functions - Catch-all route handler
// This handles ALL requests and ensures correct MIME types

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
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Try to fetch the asset from the static files
  try {
    const assetResponse = await env.ASSETS.fetch(request);
    
    // If asset exists (not 404)
    if (assetResponse.status !== 404) {
      const mimeType = getMimeType(pathname);
      
      if (mimeType) {
        const headers = new Headers(assetResponse.headers);
        headers.set('Content-Type', mimeType);
        headers.set('X-Content-Type-Options', 'nosniff');
        
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers: headers,
        });
      }
      
      return assetResponse;
    }
    
    // Asset not found - serve index.html for SPA routing
    const indexRequest = new Request(new URL('/index.html', request.url), request);
    const indexResponse = await env.ASSETS.fetch(indexRequest);
    
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    // Fallback to index.html
    const indexRequest = new Request(new URL('/index.html', request.url), request);
    const indexResponse = await env.ASSETS.fetch(indexRequest);
    
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

