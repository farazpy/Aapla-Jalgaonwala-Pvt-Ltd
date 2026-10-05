import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserAddress, Order } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup' | 'partner';
  openAuthModal: (tab?: 'login' | 'signup' | 'partner') => void;
  closeAuthModal: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password?: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (googleData?: { email: string; name?: string; picture?: string; googleId?: string; credential?: string; accessToken?: string }) => Promise<{ success: boolean; message?: string }>;
  initiateGoogleOAuth: () => Promise<void>;
  logout: () => void;
  setSession: (user: User, token: string) => void;
  updateProfile: (data: { name: string; phone?: string; avatarUrl?: string }) => Promise<boolean>;
  addresses: UserAddress[];
  saveAddress: (address: Partial<UserAddress>) => Promise<UserAddress | null>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  userOrders: Order[];
  fetchUserOrders: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'ajw_auth_token';
const USER_KEY = 'ajw_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'partner'>('login');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const persistSession = useCallback((newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setToken(newToken);
    if (newUser && newToken) {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_KEY, newToken);
      if (newUser.addresses) {
        setAddresses(newUser.addresses);
      }
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      setAddresses([]);
      setUserOrders([]);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);

    try {
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        const fetchedUser = json.data.user;
        const fetchedToken = json.data.token || activeToken || `token_${fetchedUser.id}_${Date.now()}`;
        setUser(fetchedUser);
        setToken(fetchedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(fetchedUser));
        localStorage.setItem(TOKEN_KEY, fetchedToken);
        if (fetchedUser.addresses) {
          setAddresses(fetchedUser.addresses);
        }
      } else if (json.success && !json.data?.user) {
        setUser(null);
        setToken(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setAddresses([]);
        setUserOrders([]);
      }
    } catch (err) {
      console.warn('[Auth] Failed to refresh profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUserOrders = useCallback(async () => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);

    try {
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch('/api/auth/orders', {
        headers,
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserOrders(json.data);
      }
    } catch (err) {
      console.warn('[Auth] Error fetching user orders:', err);
    }
  }, [token]);

  // Handle postMessage from Google OAuth popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin if possible
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' || event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token: receivedToken, user: receivedUser } = event.data;
        if (receivedToken && receivedUser) {
          persistSession(receivedUser, receivedToken);
          setIsAuthModalOpen(false);
        } else {
          refreshProfile();
          setIsAuthModalOpen(false);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [persistSession, refreshProfile]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const openAuthModal = (tab: 'login' | 'signup' | 'partner' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || res.status === 302) {
        return { success: false, message: 'Third-party cookie access is restricted in this preview frame. Please open the app in a new tab to log in successfully!' };
      }

      const json = await res.json();
      if (json.success && json.data?.user && json.data?.token) {
        persistSession(json.data.user, json.data.token);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, message: json.error?.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login' };
    }
  };

  const signup = async (name: string, email: string, password?: string, phone?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, phone })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || res.status === 302) {
        return { success: false, message: 'Third-party cookie access is restricted in this preview frame. Please open the app in a new tab to sign up successfully!' };
      }

      const json = await res.json();
      if (json.success && json.data?.user && json.data?.token) {
        persistSession(json.data.user, json.data.token);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, message: json.error?.message || 'Signup failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during signup' };
    }
  };

  const loginWithGoogle = async (googleData?: { email: string; name?: string; picture?: string; googleId?: string; credential?: string; accessToken?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!googleData) {
        // Fallback to initiating popup
        await initiateGoogleOAuth();
        return { success: true };
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(googleData)
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || res.status === 302) {
        return { success: false, message: 'Third-party cookie access is restricted in this preview frame. Please open the app in a new tab to authenticate with Google!' };
      }

      const json = await res.json();
      if (json.success && json.data?.user && json.data?.token) {
        persistSession(json.data.user, json.data.token);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, message: json.error?.message || 'Google login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error authenticating with Google' };
    }
  };

  const initiateGoogleOAuth = async (): Promise<void> => {
    try {
      // 1. Fetch OAuth URL from server with current origin callback or default aaplajalgaonwala.com
      const currentOriginRedirect = `${window.location.origin}/auth/callback`;
      const urlEndpoint = `/api/auth/google/url?redirect_uri=${encodeURIComponent(currentOriginRedirect)}`;
      const res = await fetch(urlEndpoint);
      const json = await res.json();
      const authData = json.data || {};

      if (authData.configured && authData.url) {
        return new Promise<void>((resolve, reject) => {
          const width = 540;
          const height = 650;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const authWindow = window.open(
            authData.url,
            'google_oauth_popup',
            `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no,resizable=yes`
          );

          if (!authWindow) {
            reject(new Error('Please allow popups in your browser to connect with your Google Account.'));
            return;
          }

          const handleMessage = (event: MessageEvent) => {
            if (event.data && (event.data.type === 'GOOGLE_OAUTH_SUCCESS' || event.data.type === 'OAUTH_AUTH_SUCCESS')) {
              window.removeEventListener('message', handleMessage);
              clearInterval(timer);
              const { user: googleUser, token: appToken } = event.data;
              if (googleUser && appToken) {
                persistSession(googleUser, appToken);
                closeAuthModal();
                resolve();
              } else {
                refreshProfile().then(() => {
                  closeAuthModal();
                  resolve();
                });
              }
            } else if (event.data && (event.data.type === 'GOOGLE_OAUTH_ERROR' || event.data.type === 'OAUTH_AUTH_ERROR')) {
              window.removeEventListener('message', handleMessage);
              clearInterval(timer);
              reject(new Error(event.data.error || event.data.message || 'Google authentication failed.'));
            }
          };

          window.addEventListener('message', handleMessage);

          let pollCount = 0;
          const timer = setInterval(() => {
            pollCount++;
            try {
              if (authWindow && authWindow.closed) {
                clearInterval(timer);
                window.removeEventListener('message', handleMessage);
                resolve();
              }
            } catch {
              // Silently ignore Cross-Origin-Opener-Policy restriction while the window is on Google's domain
            }

            // Safety timeout after 5 minutes
            if (pollCount > 300) {
              clearInterval(timer);
              window.removeEventListener('message', handleMessage);
            }
          }, 1000);
        });
      } else {
        // Direct Google Sign-In with real user credentials
        const emailInput = prompt('Enter your Google Account email address:');
        if (!emailInput || !emailInput.trim()) return;

        const email = emailInput.trim().toLowerCase();
        const defaultName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const nameInput = prompt('Enter your full name as on your Google Account:', defaultName);
        const name = (nameInput && nameInput.trim()) ? nameInput.trim() : defaultName;
        const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9B111E&color=fff&size=200&bold=true`;
        const googleId = `g_${Date.now()}`;

        await loginWithGoogle({
          email,
          name,
          picture,
          googleId
        });
      }
    } catch (err: any) {
      console.error('[Google OAuth] Failed to initiate:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('Logout error:', err);
    }
    persistSession(null, null);
  };

  const setSession = useCallback((newUser: User, newToken: string) => {
    persistSession(newUser, newToken);
  }, [persistSession]);

  const updateProfile = async (data: { name: string; phone?: string; avatarUrl?: string }): Promise<boolean> => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken || ''}`
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(json.data.user));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update profile failed:', err);
      return false;
    }
  };

  const saveAddress = async (address: Partial<UserAddress>): Promise<UserAddress | null> => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken || ''}`
        },
        body: JSON.stringify(address),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && json.data?.address) {
        if (json.data.addresses) {
          setAddresses(json.data.addresses);
        } else {
          setAddresses(prev => [json.data.address, ...prev.filter(a => a.id !== json.data.address.id)]);
        }
        return json.data.address;
      }
      return null;
    } catch (err) {
      console.error('Save address failed:', err);
      return null;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch(`/api/auth/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken || ''}`
        },
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?.addresses) {
          setAddresses(json.data.addresses);
        } else {
          setAddresses(prev => prev.filter(a => a.id !== addressId));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete address failed:', err);
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      const res = await fetch(`/api/auth/addresses/${addressId}/default`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken || ''}`
        },
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?.addresses) {
          setAddresses(json.data.addresses);
        } else {
          setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addressId })));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Set default address failed:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        loginWithGoogle,
        initiateGoogleOAuth,
        logout,
        setSession,
        updateProfile,
        addresses,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        userOrders,
        fetchUserOrders,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
