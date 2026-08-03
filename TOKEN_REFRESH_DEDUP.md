# Token Refresh Deduplication & Queue System

## Overview

This document explains the production-ready HTTP interceptor that solves the **token refresh race condition** problem. When multiple concurrent requests fail with 401 (Unauthorized), the interceptor ensures only **one** refresh request is made, and all other requests are queued and retried with the new token.

## Problem Scenario

**Before Deduplication:**
```
Time: T0
- Request 1 → 401
- Request 2 → 401  
- Request 3 → 401
- Request 4 → 401

↓ All fire refresh simultaneously ↓

- POST /auth/refresh (Request 1)
- POST /auth/refresh (Request 2) ← RACE CONDITION
- POST /auth/refresh (Request 3) ← RACE CONDITION
- POST /auth/refresh (Request 4) ← RACE CONDITION

Result: Backend receives 4 concurrent refresh requests
        → Token invalidation issues
        → Corrupted session state
        → "Token Invalid" errors
```

**After Deduplication:**
```
Time: T0
- Request 1 → 401
- Request 2 → 401  
- Request 3 → 401
- Request 4 → 401

↓ Only ONE refresh fires ↓

- POST /auth/refresh (Request 1) ← SINGLE REQUEST
- Request 2, 3, 4 queued...

↓ Refresh succeeds ↓

- Request 2, 3, 4 retried with new token ← SEQUENTIAL RETRY
```

## Implementation Details

### State Variables

```typescript
let isRefreshing = false;           // Flag: is refresh in progress?
let refreshPromise: Promise<boolean> | null = null;  // Single refresh promise
let failedQueue: QueuedRequest[] = [];  // Waiting requests
```

### Key Functions

#### 1. `attemptRefresh()` - Deduplicating Refresh

```typescript
const attemptRefresh = async (): Promise<boolean> => {
  // Already refreshing? Return existing promise (deduplication)
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`/auth/refresh`, {
        credentials: 'include', // Browser sends refresh_token cookie
      });

      if (!response.ok) {
        processQueue(error);  // Reject all queued requests
        handleRefreshFailure(); // Redirect to login
        return false;
      }

      const data = await response.json();
      currentAccessToken = data.accessToken;
      
      processQueue(); // Retry all queued requests
      return true;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
```

**How Deduplication Works:**
- First 401 → `isRefreshing = false` → Start refresh
- Second 401 (while refreshing) → `isRefreshing = true` → Return existing promise
- Third 401 → Same as second, returns existing promise
- All wait for **one** refresh to complete

#### 2. `addToQueue()` - Queue Failed Requests

```typescript
const addToQueue = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    failedQueue.push({
      resolve: () => resolve(),  // Called when retry should happen
      reject,                     // Called if refresh fails
    });
  });
};
```

**Usage in `authenticatedFetch()`:**
```typescript
if (response.status === 401 && currentAccessToken) {
  if (isRefreshing) {
    // Queue this request, wait for refresh to complete
    try {
      await addToQueue();
      // Now retry with new token
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    } catch (error) {
      // Refresh failed, propagate error
      throw error;
    }
  }
}
```

#### 3. `processQueue()` - Retry Queued Requests

```typescript
const processQueue = (error: Error | null = null) => {
  if (error) {
    // Refresh failed: reject all waiting requests
    failedQueue.forEach((prom) => prom.reject(error));
  } else {
    // Refresh succeeded: resolve all waiting requests
    // They will retry with new token
    failedQueue.forEach((prom) => prom.resolve());
  }
  failedQueue = [];
};
```

**Execution Timeline:**
```
T0: Request A, B, C fail → 401
T1: A starts refresh (isRefreshing = true)
T2: B tries refresh, queued (isRefreshing = true)
T3: C tries refresh, queued (isRefreshing = true)
T4: A's refresh completes → processQueue() called
T5: B and C's promises resolve → they retry
T6: B and C complete with new token
```

#### 4. `authenticatedFetch()` - Main Interceptor

```typescript
export const authenticatedFetch = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  let headers = {
    'Authorization': `Bearer ${currentAccessToken}`,
    ...options.headers,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && currentAccessToken) {
    if (isRefreshing) {
      // Refresh already in progress, queue this request
      try {
        await addToQueue();
        // Retry with new token
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
        response = await fetch(url, { ...options, headers });
      } catch (error) {
        throw error;
      }
    } else {
      // Start refresh
      const refreshed = await attemptRefresh();
      if (refreshed && currentAccessToken) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }
  }

  return response;
};
```

## Usage Examples

### 1. Simple Authenticated Fetch

```typescript
import { authenticatedFetch } from '../lib/api';

async function loadCampaigns() {
  try {
    const response = await authenticatedFetch('/api/campaigns');
    if (response.ok) {
      const data = await response.json();
      console.log('Campaigns:', data);
    }
  } catch (error) {
    console.error('Failed to load campaigns:', error);
  }
}
```

### 2. Concurrent Requests (Triggers Deduplication)

```typescript
// All requests fire simultaneously
async function loadDashboard() {
  try {
    const [campaigns, donors, analytics] = await Promise.all([
      authenticatedFetch('/api/campaigns').then(r => r.json()),
      authenticatedFetch('/api/donors').then(r => r.json()),
      authenticatedFetch('/api/analytics').then(r => r.json()),
    ]);
    
    console.log({ campaigns, donors, analytics });
  } catch (error) {
    console.error('Dashboard load failed:', error);
  }
}

// If token expires while all are in-flight:
// - All get 401
// - Only ONE /auth/refresh fires
// - All are retried and complete successfully
```

### 3. Token Refresh Callback

```typescript
async function loadUserData() {
  const response = await authenticatedFetch(
    '/api/user',
    {},
    (newToken) => {
      // Called when token was refreshed
      console.log('Token refreshed, new token length:', newToken.length);
      // Could emit event here for UI notification
    }
  );
  
  if (response.ok) {
    const user = await response.json();
    return user;
  }
}
```

### 4. Using AuthenticatedApi Class

```typescript
import { AuthenticatedApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export const CampaignManager = () => {
  const { accessToken, logout } = useAuth();
  
  const handleCreateCampaign = async (data) => {
    const api = new AuthenticatedApi(() => accessToken, logout);
    
    try {
      const response = await api.post('/api/campaigns', data);
      if (response.ok) {
        const campaign = await response.json();
        console.log('Campaign created:', campaign);
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  return <button onClick={() => handleCreateCampaign({...})}>Create</button>;
};
```

## Queue Behavior - Detailed Walkthrough

### Scenario: 4 Concurrent Requests Fail Simultaneously

```
=== INITIAL STATE ===
isRefreshing: false
failedQueue: []
currentAccessToken: "token_abc123"

=== T0: Four requests fired ===
request1: GET /api/campaigns → 401
request2: GET /api/donors → 401  
request3: GET /api/analytics → 401
request4: POST /api/settings → 401

=== T1: Request 1 handles 401 ===
isRefreshing: false (first time)
↓
attemptRefresh() called
isRefreshing = true
refreshPromise = fetch(/auth/refresh)

=== T2: Requests 2, 3, 4 handle 401 ===
isRefreshing: true (already refreshing!)
↓
attemptRefresh() called
returns existing refreshPromise (DEDUPLICATION!)

For each:
addToQueue() → adds promise to failedQueue
await addToQueue() → waits for refresh to complete

failedQueue.length: 3

=== T3: Request 1's refresh completes ===
response: { accessToken: "token_xyz789" }
↓
currentAccessToken = "token_xyz789"
isRefreshing = false
processQueue() called

For each in failedQueue:
  prom.resolve() ← unblocks that request

failedQueue.length: 0

=== T4-T6: Requests 2, 3, 4 unblocked ===
Each retries with new Authorization header:
Authorization: Bearer token_xyz789

All succeed with fresh token ✓
```

## Error Handling - Terminal Failure

```typescript
// If refresh fails (e.g., refresh token is also invalid):
if (!response.ok) {
  const error = new Error('Token refresh failed');
  processQueue(error);  // Reject all queued promises
  handleRefreshFailure(); // Clear state + redirect
}

// handleRefreshFailure():
const handleRefreshFailure = () => {
  currentAccessToken = null;
  localStorage.removeItem('user');
  window.location.href = '/signin'; // Redirect to login
};

// Result:
// - All queued requests rejected
// - User redirected to login
// - No infinite retry loop
```

## Key Benefits

✅ **Race Condition Eliminated** - Only ONE refresh per expiration event
✅ **Transparent Retry** - Failed requests auto-retry with new token
✅ **Zero Concurrent Refreshes** - `isRefreshing` flag prevents duplicates
✅ **Queue-based Ordering** - Requests retry in order after refresh
✅ **Terminal Failure Handling** - Invalid refresh token → redirect to login
✅ **Production Ready** - Handles edge cases and cleanup
✅ **Zero Config** - Works automatically with `authenticatedFetch()`

## Monitoring & Debugging

```typescript
// Add logging to track deduplication:
const attemptRefresh = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) {
    console.log('[Auth] Dedup: returning existing refresh promise');
    return refreshPromise;
  }

  console.log('[Auth] Starting token refresh');
  isRefreshing = true;
  
  // ... rest of function
};

const processQueue = (error: Error | null = null) => {
  console.log(`[Auth] Processing queue: ${failedQueue.length} requests`);
  if (error) {
    console.error('[Auth] Queue failed:', error.message);
  } else {
    console.log('[Auth] Queue succeeded, retrying requests');
  }
  // ... rest of function
};
```

## Testing the Deduplication

```typescript
// Trigger multiple concurrent requests
async function testDedup() {
  const results = await Promise.allSettled([
    authenticatedFetch('/api/test1'),
    authenticatedFetch('/api/test2'),
    authenticatedFetch('/api/test3'),
    authenticatedFetch('/api/test4'),
  ]);
  
  // Check console logs - should see exactly ONE /auth/refresh call
  // followed by 4 retried requests
  console.log('Results:', results);
}
```

## Migration from Old Implementation

**Before:**
```typescript
// Old code - multiple refreshes fired
export const authenticatedFetch = async (url: string, options: any) => {
  let response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Every 401 triggered a refresh!
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(url, { ...options });
    }
  }
  return response;
};
```

**After:**
```typescript
// New code - single refresh with deduplication
const response = await authenticatedFetch(url, options);
// Under the hood: automatic dedup + queue handling
```

No code changes needed! The deduplication works transparently.
