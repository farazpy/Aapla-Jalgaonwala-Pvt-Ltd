import { SiteSettings, Product, Category, User } from '@/types';

export interface BootstrapData {
  settings: SiteSettings;
  products: Product[];
  categories: Category[];
  auth: {
    user: User | null;
    token: string | null;
    ordersCount: number;
  };
}

let bootstrapPromise: Promise<BootstrapData | null> | null = null;
let cachedBootstrap: BootstrapData | null = null;

/**
 * Fetch unified bootstrap payload once and reuse in-flight or cached promise
 * across SettingsContext, AuthContext, HomePage, and Navigation.
 */
export async function getBootstrapData(forceRefresh = false): Promise<BootstrapData | null> {
  if (cachedBootstrap && !forceRefresh) {
    return cachedBootstrap;
  }

  if (bootstrapPromise && !forceRefresh) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ajw_auth_token') : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['app_auth_token'] = token;
        headers['x-auth-token'] = token;
      }

      const res = await fetch('/api/bootstrap', {
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error(`Bootstrap failed with status ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        cachedBootstrap = json.data as BootstrapData;
        return cachedBootstrap;
      }
    } catch (err) {
      console.warn('[Bootstrap] Failed to load unified bootstrap data:', err);
    } finally {
      bootstrapPromise = null;
    }
    return null;
  })();

  return bootstrapPromise;
}

export function getCachedBootstrap(): BootstrapData | null {
  return cachedBootstrap;
}

export function invalidateBootstrapCache(): void {
  cachedBootstrap = null;
  bootstrapPromise = null;
}
