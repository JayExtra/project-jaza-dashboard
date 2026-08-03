# Secure Authentication Implementation Guide

## Overview

This document describes the secure hybrid token management system for the Project Jaza Dashboard. It implements best practices by:

- **Storing the Refresh Token** in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie (handled automatically by the browser)
- **Storing the Access Token** in client-side JavaScript memory (React state) only
- **Performing silent refresh** on app startup to restore sessions from the refresh token cookie

## Architecture

### Files

```
src/
├── context/
│   └── AuthContext.tsx          # Main auth context with token management
├── hooks/
│   └── useAuth.ts               # Custom hook for accessing auth
├── lib/
│   └── api.ts                   # API utilities with interceptors
├── App.tsx                       # Updated to wrap with AuthProvider
└── pages/
    ├── SignIn.tsx               # Updated to use AuthContext
    ├── SignUp.tsx               # Updated to use AuthContext
    ├── VerifyEmail.tsx          # Updated to use AuthContext
    ├── DashboardLayout.tsx       # Updated to use AuthContext
    └── ForgotPassword.tsx        # (Can be updated similarly)
```

## Core Components

### 1. AuthContext (`src/context/AuthContext.tsx`)

Manages:
- `accessToken`: In-memory state (cleared on page refresh)
- `user`: User information from localStorage
- `isAuthenticated`: Computed state
- `isLoading`: Initial auth check state

Key methods:
- `login(email, password)`: Authenticate with credentials
- `signup(userData)`: Register new user
- `logout()`: Clear local state and call backend
- `silentRefresh()`: Refresh access token from refresh token cookie
- `updateUser(updates)`: Update user info and sync to localStorage

```typescript
// Initialize auth and attempt silent refresh
useEffect(() => {
  const initializeAuth = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Try to get fresh access token from refresh token cookie
    await silentRefreshInternal();
  };
  initializeAuth();
}, []);
```

### 2. useAuth Hook (`src/hooks/useAuth.ts`)

Simple custom hook for accessing auth context:

```typescript
const { accessToken, user, isAuthenticated, login, logout } = useAuth();
```

### 3. API Utilities (`src/lib/api.ts`)

Provides helpers for making authenticated requests:

#### `setAuthToken(token)` and `getAuthToken()`
- Module functions to sync auth context token with the API layer

#### `authenticatedFetch<T>(url, options, onTokenRefresh?)`
- Enhanced fetch wrapper that:
  - Automatically adds `Authorization: Bearer <token>` header
  - Handles 401 responses by attempting token refresh
  - Retries the original request with new token
  - Maintains consistency with standard `fetch` API

```typescript
const response = await authenticatedFetch('/api/campaigns', {
  method: 'GET',
}, (newToken) => {
  console.log('Token refreshed:', newToken);
});
```

#### `AuthenticatedApi` Class
- Provides class-based interface for authenticated requests with custom token getter

```typescript
const api = new AuthenticatedApi(
  () => currentAccessToken,
  () => logout()
);

const response = await api.get('/api/campaigns');
const data = await api.post('/api/campaigns', { name: 'Q1 Campaign' });
```

## Usage Examples

### Making Authenticated API Calls

#### Option 1: Using `authenticatedFetch` (Recommended)

```typescript
import { useAuth } from '../hooks/useAuth';
import { authenticatedFetch } from '../lib/api';

export const CampaignList = () => {
  const { accessToken } = useAuth();
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await authenticatedFetch('/api/campaigns');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };
    
    fetchCampaigns();
  }, []);

  return (
    <div>
      {campaigns.map(campaign => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
    </div>
  );
};
```

#### Option 2: Using `AuthenticatedApi` Class

```typescript
import { useAuth } from '../hooks/useAuth';
import { AuthenticatedApi } from '../lib/api';

export const DonorManagement = () => {
  const { accessToken, logout } = useAuth();

  const handleAddDonor = async (donorData: any) => {
    const api = new AuthenticatedApi(() => accessToken, logout);
    
    try {
      const response = await api.post('/api/donors', donorData);
      if (response.ok) {
        const newDonor = await response.json();
        console.log('Donor added:', newDonor);
      }
    } catch (error) {
      console.error('Error adding donor:', error);
    }
  };

  return (
    <button onClick={() => handleAddDonor({ name: 'John Doe', email: 'john@example.com' })}>
      Add Donor
    </button>
  );
};
```

#### Option 3: Direct useAuth with Standard Fetch

For simple cases where you want to manually manage the token:

```typescript
export const Settings = () => {
  const { accessToken, isAuthenticated } = useAuth();

  const handleUpdateProfile = async () => {
    if (!accessToken) return;

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: 'New Name' }),
      credentials: 'include',
    });

    if (response.ok) {
      console.log('Profile updated');
    }
  };

  return <button onClick={handleUpdateProfile}>Update Profile</button>;
};
```

### Authentication Flow

#### Sign In

```typescript
import { useAuth } from '../hooks/useAuth';

export const SignIn = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/'); // Auth context handles token storage
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit('user@example.com', 'password123');
    }}>
      {/* form fields */}
    </form>
  );
};
```

#### Sign Out

```typescript
import { useAuth } from '../hooks/useAuth';

export const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate even if logout fails
      navigate('/signin');
    }
  };

  return <button onClick={handleLogout}>Sign Out</button>;
};
```

#### Silent Refresh (Automatic)

Happens automatically in two places:

1. **On App Startup** - `AuthContext` initialization
```typescript
useEffect(() => {
  const initializeAuth = async () => {
    // ... restore user from localStorage
    const refreshed = await silentRefreshInternal();
    // ... handle if refresh failed
  };
  initializeAuth();
}, []);
```

2. **When Access Token Expires** - `authenticatedFetch` detects 401 and refreshes
```typescript
// If API returns 401, authenticatedFetch will:
// 1. Call POST /auth/refresh with credentials: 'include'
// 2. Get new accessToken from response
// 3. Retry original request with new token
```

## Backend Requirements

Your backend `/auth` endpoints must:

### 1. `/auth/login` (POST)
- Accept: `{ email, password }`
- Return: `{ accessToken, userId, email, firstName, lastName, role, emailVerified, organisation }`
- Set: `HttpOnly, Secure, SameSite=Lax` refresh token cookie

### 2. `/auth/register` (POST)
- Accept: `{ firstName, lastName, email, password }`
- Return: Similar to login (optional - may require manual login after signup)
- Set: refresh token cookie (optional)

### 3. `/auth/refresh` (POST)
- Accept: No body needed (refresh token comes from cookie automatically)
- Return: `{ accessToken, user? }`
- Credentials: Client sends via `credentials: 'include'`

### 4. `/auth/logout` (POST)
- Accept: `{ allDevices?: boolean }`
- Action: Invalidate refresh token in cookie
- Clear: HttpOnly cookie by setting `Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

### 5. `/auth/email/verify` (GET)
- Query: `?email_token={token}`
- Return: `{ verified: boolean, auth?: {...}, requiresLogin?: boolean }`

### 6. `/auth/email/verification/status` (GET)
- Return: `{ isVerified: boolean }`

### 7. `/auth/email/resend` (POST)
- Return: `{ message: string, cooldownSeconds: number, attemptsRemaining: number }`

## Security Considerations

✅ **What's Secure:**
- Refresh token in `HttpOnly` cookie - protected from XSS
- Access token in memory only - cleared on page refresh
- `credentials: 'include'` ensures cookies sent with CORS requests
- Token refresh automatic and transparent

⚠️ **Still Vulnerable to CSRF/XSRF:**
- If using traditional cookies for state, implement CSRF tokens
- Or use same-site cookie restrictions (already set)

🔒 **Best Practices Implemented:**
- No sensitive tokens in `localStorage` (except user info)
- Automatic token refresh on 401
- Clear error handling and logging
- Session restoration on page reload

## Migration Checklist

If migrating from localStorage-based tokens:

- [ ] Remove all `localStorage.setItem('accessToken', ...)`
- [ ] Remove all `localStorage.getItem('accessToken')`
- [ ] Remove manual `Authorization` header creation
- [ ] Wrap app with `<AuthProvider>`
- [ ] Replace `fetch()` calls with `authenticatedFetch()` or `useAuth()`
- [ ] Update logout to call `logout()` from `useAuth()`
- [ ] Test OAuth callback to ensure refresh token cookie is set
- [ ] Test page refresh - should restore session via silent refresh
- [ ] Test token expiry and automatic refresh

## Debugging

### Check Token in Memory
```typescript
const { accessToken, user, isAuthenticated } = useAuth();
console.log('Token:', accessToken);
console.log('User:', user);
console.log('Authenticated:', isAuthenticated);
```

### Check Refresh Token Cookie (DevTools)
1. Open DevTools → Application → Cookies
2. Look for `refreshToken` (or similar name set by backend)
3. Verify: `HttpOnly` ✓, `Secure` ✓, `SameSite=Lax` ✓

### Monitor Network Requests
- Login should return access token in response + set refresh cookie
- Subsequent requests should include `Authorization: Bearer <token>`
- On 401, should see automatic POST to `/auth/refresh`
- Refresh should return new access token

### Enable Debug Logging
```typescript
// In lib/api.ts
console.log('Fetching:', url);
console.log('Token:', currentAccessToken ? 'present' : 'missing');
console.log('Response:', response.status, response.statusText);
```

## Known Limitations

1. **No persistent memory** - Access token lost on page refresh (use silent refresh via cookie)
2. **Tab synchronization** - Each tab has its own in-memory token (not sync'd across tabs)
3. **Service Workers** - Limited access to cookies in some scenarios
4. **Private Browsing** - Some browsers limit cookie persistence

## Future Enhancements

- [ ] Cross-tab token synchronization using `BroadcastChannel` API
- [ ] Automatic logout on token expiry with user notification
- [ ] Token refresh before expiry (proactive refresh)
- [ ] Support for multiple auth strategies (SAML, OpenID Connect)
- [ ] Audit logging for auth events
