import fs from 'fs/promises';
import path from 'path';

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30000; // 30s fast cache with instant write invalidation

export function clearJsonCache(filename?: string) {
  if (filename) {
    memoryCache.delete(filename);
  } else {
    memoryCache.clear();
  }
}

export async function readJson<T>(filename: string, fallback: T): Promise<T> {
  const cached = memoryCache.get(filename);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  try {
    const dirPath = path.join(process.cwd(), 'server', 'data');
    await fs.mkdir(dirPath, { recursive: true });
    
    // First check unified local_db.json if collection exists in it
    const localDbPath = path.join(dirPath, 'local_db.json');
    try {
      const localDbRaw = await fs.readFile(localDbPath, 'utf-8');
      const localDb = JSON.parse(localDbRaw);
      const collectionKey = filename.replace('.json', '');
      if (localDb && localDb[collectionKey] !== undefined) {
        memoryCache.set(filename, { data: localDb[collectionKey], timestamp: Date.now() });
        return localDb[collectionKey] as T;
      }
    } catch {
      // local_db.json not found or not parsed, continue to file
    }

    const filePath = path.join(dirPath, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data) as T;
    memoryCache.set(filename, { data: parsed, timestamp: Date.now() });
    return parsed;
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.warn(`[JSON Storage] Error reading ${filename}, returning fallback:`, error);
    }
    memoryCache.set(filename, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<boolean> {
  try {
    const dirPath = path.join(process.cwd(), 'server', 'data');
    await fs.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    memoryCache.set(filename, { data, timestamp: Date.now() });

    // Also update unified local_db.json
    try {
      const localDbPath = path.join(dirPath, 'local_db.json');
      let localDb: Record<string, any> = {};
      try {
        const raw = await fs.readFile(localDbPath, 'utf-8');
        localDb = JSON.parse(raw);
      } catch {
        localDb = {};
      }
      const collectionKey = filename.replace('.json', '');
      localDb[collectionKey] = data;
      await fs.writeFile(localDbPath, JSON.stringify(localDb, null, 2), 'utf-8');
    } catch (dbErr) {
      // Ignore local_db sync error
    }

    return true;
  } catch (error) {
    console.error(`[JSON Storage] Error writing ${filename}:`, error);
    return false;
  }
}

export function invalidateJsonCache(filename?: string) {
  if (filename) {
    memoryCache.delete(filename);
  } else {
    memoryCache.clear();
  }
}
