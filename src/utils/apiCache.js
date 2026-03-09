
/**
 * API Response Cache
 * Caches GET requests in IndexedDB for offline support
 */

const DB_NAME = 'pryde-api-cache';
const DB_VERSION = 1;
const STORE_NAME = 'responses';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

let db = null;

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Get cached response
 */
export async function getCached(url, options = {}) {
  const { ttl = DEFAULT_TTL } = options;

  try {
    const database = await openDB();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const cached = request.result;
        
        if (!cached) {
          return resolve(null);
        }

        // Check if expired
        if (Date.now() - cached.timestamp > ttl) {
          return resolve(null);
        }

        resolve(cached.data);
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('[Cache] Get failed:', error);
    return null;
  }
}

/**
 * Set cached response
 */
export async function setCached(url, data, options = {}) {
  try {
    const database = await openDB();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.put({
      url,
      data,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    console.warn('[Cache] Set failed:', error);
    return false;
  }
}

/**
 * Delete cached response
 */
export async function deleteCached(url) {
  try {
    const database = await openDB();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(url);
    return true;
  } catch (error) {
    console.warn('[Cache] Delete failed:', error);
    return false;
  }
}

/**
 * Clear all cached responses
 */
export async function clearCache() {
  try {
    const database = await openDB();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    return true;
  } catch (error) {
    console.warn('[Cache] Clear failed:', error);
    return false;
  }
}

/**
 * Clean expired entries
 */
export async function cleanExpired(ttl = DEFAULT_TTL) {
  try {
    const database = await openDB();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const cutoff = Date.now() - ttl;

    // Open cursor to iterate and delete
    const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    return true;
  } catch (error) {
    console.warn('[Cache] Clean failed:', error);
    return false;
  }
}

/**
 * cachedFetch - Drop-in replacement for fetch with caching
 */
export async function cachedFetch(url, options = {}) {
  const { 
    cache = true, 
    ttl = DEFAULT_TTL,
    forceRefresh = false,
    ...fetchOptions 
  } = options;

  // Only cache GET requests
  if (cache && options.method === undefined || options.method === 'GET') {
    if (!forceRefresh) {
      const cached = await getCached(url, { ttl });
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
      }
    }
  }

  const response = await fetch(url, fetchOptions);

  if (cache && response.ok && response.status === 200) {
    const data = await response.clone().json();
    await setCached(url, data, { ttl });
  }

  return response;
}

export default {
  getCached,
  setCached,
  deleteCached,
  clearCache,
  cleanExpired,
  cachedFetch
};

