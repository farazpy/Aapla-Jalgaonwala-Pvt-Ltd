import { SnackMitraConfig, SnackMitraLogEntry, SnackMitraStats } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const CONFIG_FILE = 'snack_mitra_config.json';
const LOGS_FILE = 'snack_mitra_logs.json';

export const DEFAULT_SNACK_MITRA_CONFIG: SnackMitraConfig = {
  enabled: true,
  botName: 'Snack Mitra',
  botTagline: 'Aapla Jalgaonwala Support',
  welcomeMessage: `Namaskar! 🙏 Welcome to **Aapla Jalgaonwala**!

I am **Snack Mitra**, your personal customer support sahayak.

How can I help you today?
- 🍌 Discover our [10 Banana Chips Flavours](/shop?category=banana-chips)
- 📖 Learn about our heritage & founders in [Our Story](/our-story)
- 📍 Store address & details on our [Contact Page](/contact)
- 📦 Live order tracking (share your Order ID or phone number)
- 🍲 Authentic [Khandeshi Shev Bhaji](/shop?category=masala) recipes
- 🚚 Free Shipping thresholds (Above ₹399 in Maharashtra)

Feel free to ask in **English, Marathi (मराठी), or Hindi (हिंदी)**!`,
  quickSuggestions: [
    { label: '🍌 Top Banana Chips', query: 'What are your top bestselling banana chips flavours and prices?' },
    { label: '📖 Our Story & Founders', query: 'Tell me about Aapla Jalgaonwala founders and our story.' },
    { label: '📍 Store & Contact Info', query: 'Where is your flagship store located and how do I contact you?' },
    { label: '📦 Track My Order', query: 'How do I track my order status live?' },
    { label: '🍲 Shev Bhaji Recipe', query: 'Can you give me the authentic Jalgaon Shev Bhaji recipe with Tikhat Shev?' },
    { label: '🚚 Free Shipping Rules', query: 'What are your delivery charges and free shipping thresholds?' },
    { label: '🏷️ Active Coupons', query: 'What active discount coupon codes can I use today?' },
    { label: '💼 Women Partner Program', query: 'Tell me about the 12% Women Business Partner program and how to earn.' },
    { label: '🙏 Fasting / Upwas Snacks', query: 'Which snacks are safe for Upwas/Fasting with Sendha Namak?' }
  ],
  characterMin: 200,
  characterMax: 300,
  systemTone: 'warm',
  whatsappNumber: '+91 70574 46409',
  allowOrderTracking: true,
  specialAnnouncements: '',
  temperature: 0.5,
  maxOutputTokens: 100,
  updatedAt: new Date().toISOString()
};

let cachedConfig: { data: SnackMitraConfig; timestamp: number } | null = null;
const CACHE_TTL_MS = 10000; // 10s memory cache for ultra-responsive live changes

let logsTableChecked = false;

export class SnackMitraRepository {
  /**
   * Ensure MySQL logs table exists
   */
  private static async ensureLogsTable(): Promise<void> {
    if (logsTableChecked) return;
    const pool = getDbPool();
    if (!pool) return;

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS snack_mitra_logs (
          id VARCHAR(64) PRIMARY KEY,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          customer_query TEXT NOT NULL,
          bot_reply TEXT NOT NULL,
          prompt_tokens INT DEFAULT 0,
          response_tokens INT DEFAULT 0,
          total_tokens INT DEFAULT 0,
          reply_char_count INT DEFAULT 0,
          order_found BOOLEAN DEFAULT FALSE,
          order_number VARCHAR(64) NULL,
          status VARCHAR(20) DEFAULT 'success',
          response_time_ms INT DEFAULT 0,
          client_ip VARCHAR(64) NULL,
          INDEX idx_timestamp (timestamp),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      logsTableChecked = true;
    } catch (err: any) {
      console.warn('[SnackMitraRepo] Table creation check warning:', err?.message || err);
    }
  }

  /**
   * Get current bot configuration (live reflecting)
   */
  static async getConfig(): Promise<SnackMitraConfig> {
    if (cachedConfig && Date.now() - cachedConfig.timestamp < CACHE_TTL_MS) {
      return cachedConfig.data;
    }

    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT setting_value FROM site_settings WHERE setting_key = "snack_mitra_config" LIMIT 1'
        );
        if (Array.isArray(rows) && rows.length > 0 && rows[0].setting_value) {
          const parsed = typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
          const merged: SnackMitraConfig = { ...DEFAULT_SNACK_MITRA_CONFIG, ...parsed };
          cachedConfig = { data: merged, timestamp: Date.now() };
          return merged;
        }
      } catch (err: any) {
        if (!err?.message?.includes("doesn't exist")) {
          console.warn('[SnackMitraRepo] MySQL config fetch failed, falling back to JSON:', err?.message || err);
        }
      }
    }

    const jsonConfig = await readJson<SnackMitraConfig>(CONFIG_FILE, DEFAULT_SNACK_MITRA_CONFIG);
    const merged = { ...DEFAULT_SNACK_MITRA_CONFIG, ...jsonConfig };
    cachedConfig = { data: merged, timestamp: Date.now() };
    return merged;
  }

  /**
   * Update bot configuration and invalidate cache
   */
  static async updateConfig(updates: Partial<SnackMitraConfig>): Promise<SnackMitraConfig> {
    cachedConfig = null;
    const current = await this.getConfig();
    const updated: SnackMitraConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save to JSON storage
    await writeJson(CONFIG_FILE, updated);

    // Persist to MySQL site_settings
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value)
           VALUES ('snack_mitra_config', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [JSON.stringify(updated)]
        );
      } catch (err: any) {
        console.warn('[SnackMitraRepo] MySQL config update warning:', err?.message || err);
      }
    }

    cachedConfig = { data: updated, timestamp: Date.now() };
    return updated;
  }

  /**
   * Log an assistant interaction with token metrics
   */
  static async logInteraction(
    entry: Omit<SnackMitraLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): Promise<SnackMitraLogEntry> {
    const record: SnackMitraLogEntry = {
      id: entry.id || `sml-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      customerQuery: entry.customerQuery,
      botReply: entry.botReply,
      promptTokens: entry.promptTokens || 0,
      responseTokens: entry.responseTokens || 0,
      totalTokens: entry.totalTokens || ((entry.promptTokens || 0) + (entry.responseTokens || 0)),
      replyCharCount: entry.replyCharCount || entry.botReply?.length || 0,
      orderFound: entry.orderFound || false,
      orderNumber: entry.orderNumber || null,
      status: entry.status || 'success',
      responseTimeMs: entry.responseTimeMs || 0,
      clientIp: entry.clientIp || ''
    };

    // 1. Write to JSON storage (keep last 1,000 for instant retrieval)
    try {
      const existingLogs = await readJson<SnackMitraLogEntry[]>(LOGS_FILE, []);
      const updatedLogs = [record, ...existingLogs.slice(0, 999)];
      await writeJson(LOGS_FILE, updatedLogs);
    } catch (err) {
      console.warn('[SnackMitraRepo] Failed writing JSON logs:', err);
    }

    // 2. Write to MySQL table
    await this.ensureLogsTable();
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO snack_mitra_logs (
            id, timestamp, customer_query, bot_reply, prompt_tokens,
            response_tokens, total_tokens, reply_char_count, order_found,
            order_number, status, response_time_ms, client_ip
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            new Date(record.timestamp),
            record.customerQuery,
            record.botReply,
            record.promptTokens,
            record.responseTokens,
            record.totalTokens,
            record.replyCharCount,
            record.orderFound ? 1 : 0,
            record.orderNumber,
            record.status,
            record.responseTimeMs,
            record.clientIp
          ]
        );
      } catch (err: any) {
        console.warn('[SnackMitraRepo] MySQL log insertion warning:', err?.message || err);
      }
    }

    return record;
  }

  /**
   * Retrieve message logs with optional pagination and filters
   */
  static async getLogs(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<{ logs: SnackMitraLogEntry[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    const search = options.search?.trim().toLowerCase() || '';
    const status = options.status?.trim() || '';

    await this.ensureLogsTable();
    const pool = getDbPool();

    if (pool) {
      try {
        let whereClauses: string[] = [];
        let params: any[] = [];

        if (status && status !== 'all') {
          whereClauses.push('status = ?');
          params.push(status);
        }

        if (search) {
          whereClauses.push('(customer_query LIKE ? OR bot_reply LIKE ? OR order_number LIKE ?)');
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const [countResult]: any = await pool.query(
          `SELECT COUNT(*) as total FROM snack_mitra_logs ${whereSql}`,
          params
        );
        const total = countResult && countResult[0] ? Number(countResult[0].total) : 0;

        const [rows]: any = await pool.query(
          `SELECT * FROM snack_mitra_logs ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        if (Array.isArray(rows)) {
          const logs: SnackMitraLogEntry[] = rows.map((r: any) => ({
            id: r.id,
            timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
            customerQuery: r.customer_query,
            botReply: r.bot_reply,
            promptTokens: Number(r.prompt_tokens || 0),
            responseTokens: Number(r.response_tokens || 0),
            totalTokens: Number(r.total_tokens || 0),
            replyCharCount: Number(r.reply_char_count || 0),
            orderFound: Boolean(r.order_found),
            orderNumber: r.order_number || null,
            status: (r.status as 'success' | 'fallback' | 'error' | 'instant_match' | 'cached') || 'success',
            responseTimeMs: Number(r.response_time_ms || 0),
            clientIp: r.client_ip || ''
          }));

          return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1
          };
        }
      } catch (err: any) {
        console.warn('[SnackMitraRepo] MySQL logs fetch failed, fallback to JSON:', err?.message || err);
      }
    }

    // JSON fallback
    const allLogs = await readJson<SnackMitraLogEntry[]>(LOGS_FILE, []);
    let filtered = allLogs;

    if (status && status !== 'all') {
      filtered = filtered.filter(l => l.status === status);
    }
    if (search) {
      filtered = filtered.filter(l =>
        l.customerQuery.toLowerCase().includes(search) ||
        l.botReply.toLowerCase().includes(search) ||
        (l.orderNumber && l.orderNumber.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      logs: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  /**
   * Aggregate token usage statistics and daily breakdown
   */
  static async getTokenUsageStats(): Promise<SnackMitraStats> {
    const allLogs = await readJson<SnackMitraLogEntry[]>(LOGS_FILE, []);

    // Try MySQL first for high accuracy
    await this.ensureLogsTable();
    const pool = getDbPool();
    if (pool) {
      try {
        const [sumRows]: any = await pool.query(`
          SELECT 
            COUNT(*) as total_inquiries,
            SUM(total_tokens) as total_tokens,
            SUM(prompt_tokens) as prompt_tokens,
            SUM(response_tokens) as response_tokens,
            AVG(response_time_ms) as avg_response_time,
            AVG(reply_char_count) as avg_reply_chars,
            SUM(CASE WHEN order_found = 1 THEN 1 ELSE 0 END) as orders_tracked,
            SUM(CASE WHEN DATE(timestamp) = CURDATE() THEN 1 ELSE 0 END) as today_inquiries,
            SUM(CASE WHEN DATE(timestamp) = CURDATE() THEN total_tokens ELSE 0 END) as today_tokens
          FROM snack_mitra_logs
        `);

        const [dailyRows]: any = await pool.query(`
          SELECT 
            DATE(timestamp) as log_date,
            COUNT(*) as inquiries,
            SUM(total_tokens) as tokens,
            SUM(prompt_tokens) as prompt_tokens,
            SUM(response_tokens) as response_tokens
          FROM snack_mitra_logs
          WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          GROUP BY DATE(timestamp)
          ORDER BY log_date ASC
        `);

        if (sumRows && sumRows[0] && Number(sumRows[0].total_inquiries) > 0) {
          const stats = sumRows[0];
          return {
            totalInquiries: Number(stats.total_inquiries || 0),
            totalTokens: Number(stats.total_tokens || 0),
            promptTokens: Number(stats.prompt_tokens || 0),
            responseTokens: Number(stats.response_tokens || 0),
            averageResponseTimeMs: Math.round(Number(stats.avg_response_time || 0)),
            averageReplyChars: Math.round(Number(stats.avg_reply_chars || 0)),
            ordersTracked: Number(stats.orders_tracked || 0),
            todayInquiries: Number(stats.today_inquiries || 0),
            todayTokens: Number(stats.today_tokens || 0),
            dailyUsage: (dailyRows || []).map((d: any) => ({
              date: d.log_date instanceof Date ? d.log_date.toISOString().split('T')[0] : String(d.log_date),
              inquiries: Number(d.inquiries || 0),
              tokens: Number(d.tokens || 0),
              promptTokens: Number(d.prompt_tokens || 0),
              responseTokens: Number(d.response_tokens || 0)
            }))
          };
        }
      } catch (err: any) {
        console.warn('[SnackMitraRepo] MySQL stats query warning:', err?.message || err);
      }
    }

    // JSON fallback calculation
    const totalInquiries = allLogs.length;
    let totalTokens = 0;
    let promptTokens = 0;
    let responseTokens = 0;
    let totalLatency = 0;
    let totalChars = 0;
    let ordersTracked = 0;
    let todayInquiries = 0;
    let todayTokens = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyMap: Record<string, { inquiries: number; tokens: number; promptTokens: number; responseTokens: number }> = {};

    allLogs.forEach(log => {
      totalTokens += log.totalTokens || 0;
      promptTokens += log.promptTokens || 0;
      responseTokens += log.responseTokens || 0;
      totalLatency += log.responseTimeMs || 0;
      totalChars += log.replyCharCount || 0;
      if (log.orderFound) ordersTracked += 1;

      const dateStr = log.timestamp ? log.timestamp.split('T')[0] : todayStr;
      if (dateStr === todayStr) {
        todayInquiries += 1;
        todayTokens += log.totalTokens || 0;
      }

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { inquiries: 0, tokens: 0, promptTokens: 0, responseTokens: 0 };
      }
      dailyMap[dateStr].inquiries += 1;
      dailyMap[dateStr].tokens += log.totalTokens || 0;
      dailyMap[dateStr].promptTokens += log.promptTokens || 0;
      dailyMap[dateStr].responseTokens += log.responseTokens || 0;
    });

    const dailyUsage = Object.entries(dailyMap)
      .map(([date, vals]) => ({
        date,
        ...vals
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    return {
      totalInquiries,
      totalTokens,
      promptTokens,
      responseTokens,
      averageResponseTimeMs: totalInquiries > 0 ? Math.round(totalLatency / totalInquiries) : 0,
      averageReplyChars: totalInquiries > 0 ? Math.round(totalChars / totalInquiries) : 0,
      ordersTracked,
      todayInquiries,
      todayTokens,
      dailyUsage
    };
  }

  /**
   * Clear message and token history
   */
  static async clearLogs(): Promise<{ success: boolean; clearedCount: number }> {
    const existing = await readJson<SnackMitraLogEntry[]>(LOGS_FILE, []);
    const count = existing.length;

    await writeJson(LOGS_FILE, []);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('TRUNCATE TABLE snack_mitra_logs');
      } catch (err: any) {
        console.warn('[SnackMitraRepo] TRUNCATE snack_mitra_logs warning:', err?.message || err);
      }
    }

    return { success: true, clearedCount: count };
  }
}
