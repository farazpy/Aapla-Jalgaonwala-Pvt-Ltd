import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderRepository } from '@/server/repositories/OrderRepository';
import { createSuccessResponse, createErrorResponse } from '@/server/utils/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      isSimulation
    } = await req.json();

    if (!orderId) {
      return createErrorResponse('Internal Order ID is required', 'MISSING_ORDER_ID', 400);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Handle simulation mode gracefully
    if (isSimulation || !keySecret) {
      console.log(`[Razorpay Verification] Verifying in SIMULATION mode for order: ${orderId}`);
      await OrderRepository.updatePaymentStatus(orderId, 'Paid', 'Confirmed', 'Razorpay (Simulated)');
      return createSuccessResponse({ verified: true, isSimulation: true }, 'Payment verified successfully (Simulated)');
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return createErrorResponse('Missing Razorpay credentials for verification', 'INVALID_VERIFICATION_PAYLOAD', 400);
    }

    // Standard Razorpay signature verification
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Signature is valid! Update internal order to Paid and Confirmed
      const updated = await OrderRepository.updatePaymentStatus(orderId, 'Paid', 'Confirmed', 'Razorpay');
      if (!updated) {
        return createErrorResponse('Payment signature is valid, but failed to update order database entry', 'DB_UPDATE_FAILED', 500);
      }
      return createSuccessResponse({ verified: true, isSimulation: false }, 'Payment verified and captured successfully');
    } else {
      await OrderRepository.updatePaymentStatus(orderId, 'Failed', 'Pending');
      return createErrorResponse('Payment signature verification failed', 'SIGNATURE_INVALID', 400);
    }
  } catch (error: any) {
    console.error('[Razorpay Verify API Error]:', error);
    return createErrorResponse(error.message || 'Verification error', 'VERIFICATION_ERROR', 500);
  }
}
