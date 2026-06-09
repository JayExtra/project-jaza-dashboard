import config from '../lib/config';

/**
 * Production-ready HTTP interceptor with:
 * - Automatic token attachment to requests
 * - Request deduplication on token refresh
 * - Queue-based retry mechanism
 * - Terminal failure handling (redirect to login)
 */

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

interface QueuedRequest {
  resolve: (value: Response) => void;
  reject: (reason?: any) => void;
}

// ========== Token Management ==========
let currentAccessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAuthToken = (): string | null => {
  return currentAccessToken;
};

// ========== Token Refresh Deduplication ==========
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let failedQueue: QueuedRequest[] = [];

/**
 * Process all queued requests after successful token refresh
 * Retries each with the new token
 */
const processQueue = (error: Error | null = null) => {
  if (error) {
    // Reject all queued requests on refresh failure
    failedQueue.forEach((prom) => {
      prom.reject(error);
    });
  } else {
    // Retry all queued requests with new token
    failedQueue.forEach((prom) => {
      prom.resolve(new Response('queued-retry', { status: 200 }));
    });
  }

  failedQueue = [];
};

/**
 * Attempt to refresh access token with deduplication
 * Only one refresh request runs at a time, others wait for the result
 * THREAD-SAFE: Prevents race condition between check and assignment
 * 
 * Exported for use in AuthContext to ensure all refresh attempts use deduplication
 */
export const attemptRefresh = async (): Promise<boolean> => {
  // Already refreshing? Return existing promise
  if (isRefreshing) {
    // Wait for promise to be assigned
    while (refreshPromise === null && isRefreshing) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (refreshPromise) {
      return refreshPromise;
    }
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Sends refresh token cookie automatically
      });

      if (!response.ok) {
        const error = new Error('Token refresh failed');
        processQueue(error);
        handleRefreshFailure();
        return false;
      }

      const data = await response.json();

      if (data.accessToken) {
        currentAccessToken = data.accessToken;
        processQueue(); // Retry queued requests with new token
        return true;
      }

      const error = new Error('No access token in refresh response');
      processQueue(error);
      handleRefreshFailure();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      const err = error instanceof Error ? error : new Error('Unknown refresh error');
      processQueue(err);
      handleRefreshFailure();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Handle terminal refresh failure:
 * - Clear local state
 * - Redirect to login
 */
const handleRefreshFailure = () => {
  // Clear tokens and user data
  currentAccessToken = null;
  localStorage.removeItem('user');

  // Redirect to login
  window.location.href = '/signin';
};

/**
 * Wait for a queued request to be retried
 * Returns a promise that resolves when the request should be retried
 */
const addToQueue = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    failedQueue.push({
      resolve: () => resolve(),
      reject,
    });
  });
};

// ========== Main Interceptor ==========

/**
 * Enhanced fetch function with:
 * 1. Automatic Authorization header attachment
 * 2. Deduplicating token refresh on 401
 * 3. Queue-based retry for concurrent failures
 * 4. Terminal failure handling
 */
export const authenticatedFetch = async <T = any>(
  url: string,
  options: FetchOptions = {},
  onTokenRefresh?: (newToken: string) => void
): Promise<Response> => {
  // Build headers with Authorization
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }

  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401: trigger deduplicating refresh
  if (response.status === 401 && currentAccessToken) {
    // If refresh is already in progress, queue this request
    if (isRefreshing) {
      try {
        await addToQueue();
        // Retry with new token after queue is processed
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      } catch (error) {
        console.error('Queued request rejected:', error);
        throw error;
      }
    } else {
      // Start refresh
      const refreshed = await attemptRefresh();

      if (refreshed && currentAccessToken) {
        if (onTokenRefresh) {
          onTokenRefresh(currentAccessToken);
        }
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
      // If refresh failed, handleRefreshFailure() already redirected
    }
  }

  return response;
};

/**
 * Create a request interceptor wrapper
 * Use this in contexts where you have access to the auth state
 */
export class AuthenticatedApi {
  constructor(
    private getToken: () => string | null,
    private onUnauthorized?: () => void
  ) {}

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async fetch<T = any>(
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const headers = this.getHeaders(options.headers);

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle 401
    if (response.status === 401) {
      this.onUnauthorized?.();
    }

    return response;
  }

  async get<T = any>(
    url: string,
    customHeaders?: Record<string, string>
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'GET',
      headers: customHeaders,
    });
  }

  async post<T = any>(
    url: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'POST',
      headers: customHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(
    url: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'PUT',
      headers: customHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(
    url: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'PATCH',
      headers: customHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(
    url: string,
    customHeaders?: Record<string, string>
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'DELETE',
      headers: customHeaders,
    });
  }
}
