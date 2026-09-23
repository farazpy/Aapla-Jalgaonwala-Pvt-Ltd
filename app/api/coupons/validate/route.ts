import { NextRequest } from 'next/server';
import { CouponRepository } from '@/server/repositories/CouponRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid request format', 'INVALID_PAYLOAD', 400);
    }

    const { code, subtotal = 0 } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return createErrorResponse('Please enter a valid coupon code', 'INVALID_CODE', 400);
    }

    const formattedCode = code.trim().toUpperCase();
    const coupon = await CouponRepository.getByCode(formattedCode);

    if (!coupon) {
      return createErrorResponse('Invalid or expired coupon code', 'COUPON_NOT_FOUND', 404);
    }

    const orderSubtotal = Number(subtotal) || 0;

    if (coupon.minimumOrder && orderSubtotal < coupon.minimumOrder) {
      return createErrorResponse(
        `Coupon '${coupon.code}' requires a minimum order value of ₹${coupon.minimumOrder}`,
        'MINIMUM_ORDER_NOT_MET',
        400
      );
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderSubtotal * coupon.value) / 100;
      if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
        discountAmount = coupon.maximumDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, orderSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return createSuccessResponse(
      {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        description: coupon.description
      },
      'Coupon applied successfully'
    );
  } catch (error) {
    return handleApiError(error, req, 'coupons', 'VALIDATE');
  }
}

