import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { defaultSettings, type Settings } from '../types/settings';
import config from '../lib/config';
import { attemptRefresh, getAuthToken, resetRefreshFailureFlag } from '../lib/api';

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  emailVerified: boolean;
  organisation?: string;
  profileImage?: string;
  profileImageUrl?: string;
  settings:Settings;
}


export interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  silentRefresh: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setTokenAndUser: (token: string, userData: User) => void;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage and attempt silent refresh
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Check if we have user data in localStorage (e.g., from a previous session)
        const storedUserStr = localStorage.getItem('user');
        let storedUser: User | null = null;
        
        if (storedUserStr) {
          try {
            storedUser = JSON.parse(storedUserStr);
            setUser(storedUser);
          } catch (e) {
            console.error('Failed to parse stored user', e);
            localStorage.removeItem('user');
          }
        }

        // Attempt silent refresh to get a fresh access token
        const refreshed = await silentRefreshInternal();
        
        if (!refreshed) {
          // No valid refresh token cookie, clear user
          // This will trigger a redirect to /signin via DashboardLayout guard
          setUser(null);
          setAccessToken(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth', error);
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Internal silent refresh function
   * Uses deduplication from api.ts to prevent concurrent refresh calls
   */
  const silentRefreshInternal = useCallback(async (): Promise<boolean> => {
    try {
      // Use the deduplicating attemptRefresh from api.ts
      // This ensures only ONE refresh request hits the backend even if called concurrently
      const success = await attemptRefresh();

      if (success) {
        // attemptRefresh has already updated currentAccessToken in api.ts
        // Now we need to update local auth state
        const token = getAuthToken();
        
        if (token) {
          setAccessToken(token);
        }

        // Try to fetch user data from refresh response
        // (backend may return updated user info)
        const storedUserStr = localStorage.getItem('user');
        let storedUser: User | null = null;
        if (storedUserStr) {
          try {
            storedUser = JSON.parse(storedUserStr);
          } catch (e) {
            console.error('Failed to parse stored user after refresh', e);
            localStorage.removeItem('user');
          }
        }

        if (storedUser) {
          setUser(storedUser);
          return true;
        }

        try {
          const response = await fetch(`${config.apiBaseUrl}/account/me/${user?.userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          }
        } catch (e) {
          // If fetching user info fails, that's ok - we still have the token
          // and can proceed with the authenticated state
        }

        return true;
      }

      // attemptRefresh handles terminal failure (redirect to /signin) internally
      return false;
    } catch (error) {
      console.error('Silent refresh error:', error);
      return false;
    }
  }, []);

  /**
   * Public silent refresh exposed to outside
   */
  const silentRefresh = useCallback(async (): Promise<boolean> => {
    return silentRefreshInternal();
  }, [silentRefreshInternal]);

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include', // Important: receives the refresh token cookie
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || 'Login failed');
        }

        const result = await response.json();

        if (result.accessToken) {
          // Reset the refresh failure flag on successful login
          resetRefreshFailureFlag();
          
          setAccessToken(result.accessToken);

          const userData: User = {
            userId: result.userId,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            role: result.role,
            emailVerified: result.emailVerified,
            organisation: result.organisation,
            profileImage: result.profileImage || result.imageUrl,
            profileImageUrl: result.profileImageUrl || result.imageUrl || result.thumbnailUrl,
            settings: result.settings || defaultSettings,
          };

          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('user');
        throw error;
      }
    },
    []
  );

  /**
   * Sign up with user data
   */
  const signup = useCallback(
    async (userData: SignupData) => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
          credentials: 'include',
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = 'Registration failed';
          
          if (contentType?.includes('application/json')) {
            const result = await response.json();
            errorMessage = result.message || errorMessage;
          } else {
            errorMessage = await response.text() || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        // Signup returns 201 with a string message, not tokens
        // User needs to login manually after registration
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const result = await response.json();
          // If backend returns tokens, process them
          if (result.accessToken) {
            setAccessToken(result.accessToken);
            const user: User = {
              userId: result.userId,
              email: result.email,
              firstName: result.firstName,
              lastName: result.lastName,
              role: result.role,
              emailVerified: result.emailVerified,
              organisation: result.organisation,
              profileImage: result.profileImage || result.imageUrl,
              profileImageUrl: result.profileImageUrl || result.imageUrl || result.thumbnailUrl,
            };
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        // If signup returns plain text message, just complete without setting auth
        // User will need to login manually
      } catch (error) {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('user');
        throw error;
      }
    },
    []
  );

  /**
   * Logout: clear local state and call backend
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint - refresh token cookie is automatically sent
      await fetch(`${config.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ allDevices: true }),
        credentials: 'include', // Ensure cookies are sent
      }).catch((error) => {
        // Logout endpoint may fail, but we still clear local state
        console.error('Logout endpoint error:', error);
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of backend response
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
    }
  }, [accessToken]);

  /**
   * Update user object and sync to localStorage
   */
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updated = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Handle Google OAuth token handoff from /public/profile/me endpoint
   * Called after user is redirected back from Google OAuth flow
   */
  const setTokenAndUser = useCallback((token: string, userData: User) => {
    // Reset the refresh failure flag on successful OAuth login
    resetRefreshFailureFlag();
    
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const value: AuthContextType = {
    accessToken,
    user,
    isLoading,
    isAuthenticated: !!accessToken && !!user,
    login,
    signup,
    logout,
    silentRefresh,
    setUser,
    updateUser,
    setTokenAndUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
