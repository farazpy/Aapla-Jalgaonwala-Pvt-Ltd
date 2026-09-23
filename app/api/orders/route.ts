import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { CouponRepository } from '@/server/repositories/CouponRepository';
import { OrderRepository } from '@/server/repositories/OrderRepository';
import { Order, OrderItem } from '@/types';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';
import { Logger } from '@/server/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const orders = await OrderRepository.getAll();
    return createSuccessResponse(orders, 'Orders retrieved successfully');
  } catch (error) {
    return handleApiError(error, req, 'orders', 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid request body. JSON payload expected.', 'INVALID_PAYLOAD', 400);
    }

    const {
      customer,
      shippingAddress,
      items,
      couponCode,
      paymentMethod = 'COD',
      notes
    } = body;

    // Server-side validation
    if (!customer || !customer.name || !customer.phone || !customer.email) {
      return createErrorResponse('Name, phone and email are required for the customer.', 'INVALID_CUSTOMER', 400);
    }

    const phoneDigits = String(customer.phone).replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneDigits)) {
      return createErrorResponse('Please enter a valid 10-digit Indian mobile number.', 'INVALID_PHONE', 400);
    }

    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return createErrorResponse('Complete delivery address (street, city, state, pincode) is required.', 'INVALID_ADDRESS', 400);
    }

    const pincodeDigits = String(shippingAddress.pincode).trim();
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincodeDigits)) {
      return createErrorResponse('Please enter a valid 6-digit Indian Postal PIN code.', 'INVALID_PINCODE', 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse('Your cart is empty. Please add items before placing an order.', 'EMPTY_CART', 400);
    }

    // SERVER-SIDE PRICE RE-CALCULATION & STOCK VERIFICATION
    const allProducts = await ProductRepository.getAll();
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = allProducts.find(p => p.id === item.productId || p.slug === item.productId);
      if (!product || !product.isAvailable) {
        return createErrorResponse(
          `Item "${item.productName || item.productId}" is currently unavailable or out of stock.`,
          'PRODUCT_UNAVAILABLE',
          400
        );
      }

      const qty = Math.max(1, Math.min(Number(item.quantity) || 1, product.stock || 100));
      const price = product.price; // True authoritative server price
      const itemTotal = price * qty;
      subtotal += itemTotal;

      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: price,
        image: product.images?.[0]?.url,
        variantInfo: item.variantInfo || product.netQuantity
      });
    }

    // Server-side Coupon verification
    let discount = 0;
    if (couponCode && typeof couponCode === 'string') {
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
      }
    }

    discount = Math.round(discount * 100) / 100;
    const shippingFee = subtotal >= 499 ? 0 : 40;
    const totalAmount = Math.round(Math.max(0, subtotal - discount + shippingFee) * 100) / 100;

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = `AJW-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customer: {
        name: String(customer.name).trim(),
        email: String(customer.email).trim(),
        phone: String(customer.phone).trim()
      },
      shippingAddress: {
        fullName: shippingAddress.fullName ? String(shippingAddress.fullName).trim() : String(customer.name).trim(),
        phone: shippingAddress.phone ? String(shippingAddress.phone).trim() : String(customer.phone).trim(),
        email: shippingAddress.email ? String(shippingAddress.email).trim() : String(customer.email).trim(),
        addressLine1: String(shippingAddress.addressLine1).trim(),
        addressLine2: shippingAddress.addressLine2 ? String(shippingAddress.addressLine2).trim() : undefined,
        city: String(shippingAddress.city).trim(),
        state: String(shippingAddress.state).trim(),
        pincode: String(shippingAddress.pincode).trim(),
        landmark: shippingAddress.landmark ? String(shippingAddress.landmark).trim() : undefined
      },
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      shippingFee,
      totalAmount,
      couponCode: couponCode ? String(couponCode).trim().toUpperCase() : undefined,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      paymentMethod: String(paymentMethod),
      notes: notes ? String(notes).slice(0, 500) : undefined,
      createdAt: new Date().toISOString()
    };

    const savedOrder = await OrderRepository.create(newOrder);

    await Logger.info(`Order placed successfully: ${savedOrder.orderNumber} (₹${savedOrder.totalAmount})`, {
      module: 'orders',
      functionName: 'POST',
      metadata: { orderId: savedOrder.id, orderNumber: savedOrder.orderNumber, total: savedOrder.totalAmount }
    });

    return createSuccessResponse(savedOrder, 'Order created successfully', 201);
  } catch (error) {
    return handleApiError(error, req, 'orders', 'POST');
  }
}

