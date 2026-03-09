
/**
 * Request Retry Utility
 * Exponential backoff for failed API requests
 */

/**
 * Retry options
 */
const DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH']
};

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt, options) {
  const { initialDelay, backoffMultiplier, maxDelay } = options;
  const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25;
  return delay + jitter;
}

/**
 * Check if error is retryable
 */
function isRetryable(error, options) {
  // Network errors
  if (error.code && options.retryableErrors.includes(error.code)) {
    return true;
  }

  // HTTP status codes
  if (error.response?.status && options.retryableStatuses.includes(error.response.status)) {
    return true;
  }

  return false;
}

/**
 * Retry function - wraps any async function with retry logic
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 */
export function withRetry(fn, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  return async function (...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry if not retryable
        if (!isRetryable(error, config)) {
          throw error;
        }
        
        // Don't wait after last attempt
        if (attempt === config.maxRetries) {
          break;
        }
        
        const delay = calculateDelay(attempt, config);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
        
        await sleep(delay);
      }
    }
    
    throw lastError;
  };
}

/**
 * Retry decorator for class methods
 */
export function retryable(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args) {
      const retryFn = withRetry(originalMethod.bind(this), options);
      return retryFn(...args);
    };
    
    return descriptor;
  };
}

/**
 * Create a retryable fetch wrapper
 */
export function createRetryableFetch(fetchFn = fetch, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  return async function retryableFetch(url, fetchOptions = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const response = await fetchFn(url, fetchOptions);
        
        // Check if response status is retryable
        if (config.retryableStatuses.includes(response.status)) {
          throw { response: { status: response.status } };
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (!isRetryable(error, config)) {
          throw error;
        }
        
        if (attempt === config.maxRetries) {
          break;
        }
        
        const delay = calculateDelay(attempt, config);
        console.log(`[RetryFetch] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
        
        await sleep(delay);
      }
    }
    
    throw lastError;
  };
}

/**
 * axios retry interceptor
 */
export function createAxiosRetryInterceptor(axiosInstance, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const { config: originalConfig } = error;
      
      // Don't retry if no config
      if (!originalConfig) {
        return Promise.reject(error);
      }
      
      // Don't retry if already retried
      if (originalConfig.__retryCount >= config.maxRetries) {
        return Promise.reject(error);
      }
      
      // Don't retry if not retryable
      if (!isRetryable(error, config)) {
        return Promise.reject(error);
      }
      
      // Set retry count
      originalConfig.__retryCount = originalConfig.__retryCount || 0;
      originalConfig.__retryCount++;
      
      const delay = calculateDelay(originalConfig.__retryCount - 1, config);
      console.log(`[AxiosRetry] Retrying request (attempt ${originalConfig.__retryCount}) in ${Math.round(delay)}ms...`);
      
      await sleep(delay);
      
      return axiosInstance(originalConfig);
    }
  );
}

export default {
  withRetry,
  retryable,
  createRetryableFetch,
  createAxiosRetryInterceptor,
  DEFAULT_OPTIONS
};

