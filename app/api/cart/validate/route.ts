import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { CouponRepository } from '@/server/repositories/CouponRepository';

interface CartValidateItemInput {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CartValidateItemInput[] = body.items || [];
    const couponCode: string | undefined = body.couponCode;
    const pincode: string | undefined = body.pincode;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          discount: 0,
          shippingFee: 0,
          totalAmount: 0,
          priceChangesDetected: false,
          outOfStockDetected: false
        }
      });
    }

    const allProducts = await ProductRepository.getAll();
    const validatedItems = [];
    let subtotal = 0;
    let priceChangesDetected = false;
    let outOfStockDetected = false;

    for (const item of items) {
      const product = allProducts.find(p => p.id === item.productId || p.slug === item.productId);
      if (!product || !product.isAvailable) {
        outOfStockDetected = true;
        continue;
      }

      const availableQuantity = Math.min(Math.max(1, item.quantity), product.stock || 100);
      if (availableQuantity !== item.quantity) {
        outOfStockDetected = true;
      }

      const itemTotal = product.price * availableQuantity;
      subtotal += itemTotal;

      validatedItems.push({
        product,
        quantity: availableQuantity,
        unitPrice: product.price,
        itemTotal
      });
    }

    // Coupon calculation
    let discount = 0;
    let validCoupon = null;

    if (couponCode) {
      const coupon = await CouponRepository.getByCode(couponCode);
      if (coupon && (!coupon.minimumOrder || subtotal >= coupon.minimumOrder)) {
        if (coupon.type === 'percentage') {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        } else if (coupon.type === 'fixed') {
          discount = Math.min(coupon.value, subtotal);
        }
        validCoupon = {
          code: coupon.code,
          discountAmount: Math.round(discount * 100) / 100
        };
      }
    }

    discount = Math.round(discount * 100) / 100;

    // Shipping rules: Free shipping over ₹499, else ₹40 standard delivery
    const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
    const totalAmount = Math.max(0, subtotal - discount + shippingFee);

    // Delivery estimate calculation
    let estimatedDeliveryDays = '4-8 business days';
    if (pincode && pincode.startsWith('42')) { // Jalgaon / North Maharashtra region
      estimatedDeliveryDays = '2-3 business days';
    } else if (pincode && (pincode.startsWith('40') || pincode.startsWith('41') || pincode.startsWith('43') || pincode.startsWith('44'))) {
      estimatedDeliveryDays = '3-5 business days';
    }

    return NextResponse.json({
      success: true,
      data: {
        items: validatedItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discount,
        shippingFee,
        totalAmount: Math.round(totalAmount * 100) / 100,
        coupon: validCoupon,
        estimatedDeliveryDays,
        priceChangesDetected,
        outOfStockDetected
      }
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to validate cart' } },
      { status: 500 }
    );
  }
}
