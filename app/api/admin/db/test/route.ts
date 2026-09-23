import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const host = body.host || process.env.DATABASE_HOST;
    const port = Number(body.port || process.env.DATABASE_PORT || 3306);
    const user = body.user || process.env.DATABASE_USER;
    const password = body.password !== undefined ? body.password : (process.env.DATABASE_PASSWORD || '');
    const database = body.database || process.env.DATABASE_NAME;

    if (!host || !user) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Host and User are required to test MySQL connection'
      });
    }

    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: database || undefined,
      connectTimeout: 3000
    });

    const [rows]: any = await connection.query('SELECT 1 + 1 AS test_val, NOW() AS server_time');
    await connection.end();

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Successfully connected to MySQL database!',
      serverTime: rows[0]?.server_time || new Date().toISOString(),
      database: database || 'Default'
    });
  } catch (err: any) {
    console.error('MySQL connection test error:', err);
    return NextResponse.json({
      success: false,
      connected: false,
      error: err?.message || 'Failed to connect to MySQL database'
    });
  }
}
