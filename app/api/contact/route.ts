import { NextRequest } from 'next/server';
import { InquiryRepository } from '@/server/repositories/InquiryRepository';
import { Inquiry } from '@/types';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';
import { Logger } from '@/server/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid request format', 'INVALID_PAYLOAD', 400);
    }

    const { name, email, phone, subject, message, type } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createErrorResponse('Your name is required.', 'INVALID_NAME', 400);
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return createErrorResponse('A valid email address is required.', 'INVALID_EMAIL', 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return createErrorResponse('Please write your message or inquiry.', 'INVALID_MESSAGE', 400);
    }

    const inquiry: Inquiry = {
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 100),
      phone: phone ? String(phone).trim().slice(0, 20) : '',
      subject: subject ? String(subject).trim().slice(0, 200) : 'General Inquiry',
      message: message.trim().slice(0, 3000),
      type: type || 'general'
    };

    const savedInquiry = await InquiryRepository.create(inquiry);

    await Logger.info(`Contact inquiry submitted by ${inquiry.name} (${inquiry.email})`, {
      module: 'contact',
      functionName: 'POST',
      metadata: { subject: inquiry.subject, type: inquiry.type }
    });

    return createSuccessResponse(
      savedInquiry,
      'Thank you for reaching out to Aapla Jalgaonwala! We will get back to you shortly.',
      201
    );
  } catch (error) {
    return handleApiError(error, req, 'contact', 'POST');
  }
}

