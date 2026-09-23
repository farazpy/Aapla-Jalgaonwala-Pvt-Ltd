import { NextResponse } from 'next/server';
import { getDbPool } from '@/server/database/connection';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'unconfigured_or_fallback';
  let dbLatencyMs: number | undefined;

  const pool = getDbPool();
  if (pool) {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'degraded_using_fallback';
    }
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    brand: 'Aapla Jalgaonwala',
    environment: process.env.NODE_ENV || 'production',
    database: {
      status: dbStatus,
      ...(dbLatencyMs !== undefined && { latencyMs: dbLatencyMs })
    },
    version: '1.0.0'
  });
}

