/**
 * Safe, lazy loader for Sharp image processing library.
 * Prevents server boot crashes if native platform binaries (@img/sharp-linux-x64, etc.)
 * are missing or uncompiled in the VPS environment.
 */
let sharpModule: any = null;
let sharpChecked = false;
let sharpAvailable = false;

export async function getSharp(): Promise<any | null> {
  if (sharpChecked) {
    return sharpAvailable ? sharpModule : null;
  }
  sharpChecked = true;
  try {
    const mod = await import('sharp');
    sharpModule = (mod as any).default || mod;
    sharpAvailable = typeof sharpModule === 'function';
    if (sharpAvailable) {
      console.log('[Sharp] Native image processing engine loaded successfully.');
    }
    return sharpAvailable ? sharpModule : null;
  } catch (err: any) {
    console.warn('[Sharp] Optional native binary unavailable on this VPS/Node environment (safe image passthrough will be used):', err?.message || err);
    sharpAvailable = false;
    return null;
  }
}

export function isSharpAvailableSync(): boolean {
  return sharpAvailable;
}
