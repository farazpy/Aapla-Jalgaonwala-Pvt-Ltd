import { Inquiry } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const FILE_NAME = 'inquiries.json';

export class InquiryRepository {
  static async getAll(): Promise<Inquiry[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          return (rows as any[]).map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            subject: r.subject,
            message: r.message,
            type: r.type,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('[InquiryRepo] MySQL query failed:', err);
      }
    }
    return readJson<Inquiry[]>(FILE_NAME, []);
  }

  static async create(inquiry: Inquiry): Promise<Inquiry> {
    const newInquiry: Inquiry = {
      ...inquiry,
      id: inquiry.id || `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: inquiry.createdAt || new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO inquiries (id, name, email, phone, subject, message, type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            newInquiry.id,
            newInquiry.name,
            newInquiry.email,
            newInquiry.phone,
            newInquiry.subject,
            newInquiry.message,
            newInquiry.type || 'general'
          ]
        );
        return newInquiry;
      } catch (err) {
        console.warn('[InquiryRepo] MySQL insert failed:', err);
      }
    }

    const inquiries = await readJson<Inquiry[]>(FILE_NAME, []);
    inquiries.push(newInquiry);
    await writeJson(FILE_NAME, inquiries);
    return newInquiry;
  }
}
