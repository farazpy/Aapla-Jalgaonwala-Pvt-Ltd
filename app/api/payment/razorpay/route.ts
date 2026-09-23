import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import { createSuccessResponse, createErrorResponse } from '@/server/utils/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt } = await req.json();

    if (!amount || isNaN(Number(amount))) {
      return createErrorResponse('Valid amount is required', 'INVALID_AMOUNT', 400);
    }

    const amountInPaisa = Math.round(Number(amount) * 100);
    const rp = getRazorpayInstance();

    if (!rp) {
      // Return simulation payload so the application remains 100% interactive and functional during sandbox previews
      return createSuccessResponse({
        id: `fake_rp_ord_${Date.now()}`,
        amount: amountInPaisa,
        currency: 'INR',
        receipt: receipt || `rec_${Date.now()}`,
        isSimulation: true,
        key: 'fake_key_id'
      }, 'Razorpay order created in SIMULATION mode (Keys not set)');
    }

    const order = await rp.orders.create({
      amount: amountInPaisa,
      currency: 'INR',
      receipt: receipt || `rec_${Date.now()}`,
    });

    return createSuccessResponse({
      ...order,
      key: process.env.RAZORPAY_KEY_ID,
      isSimulation: false
    }, 'Razorpay order created successfully');
  } catch (error: any) {
    console.error('[Razorpay Order API Error]:', error);
    return createErrorResponse(error.message || 'Failed to create Razorpay Order', 'RAZORPAY_ERROR', 500);
  }
}
