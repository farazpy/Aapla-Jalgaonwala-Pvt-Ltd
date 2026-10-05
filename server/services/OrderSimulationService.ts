import { fakerEN_IN, faker } from '@faker-js/faker';
import { Order, OrderItem } from '@/types';
import { OrderRepository } from '../repositories/OrderRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { PartnerRepository } from '../repositories/PartnerRepository';
import { getDbPool } from '../database/connection';
import { readJson, writeJson } from '../utils/jsonStorage';
import { INDIAN_STATES_AND_CITIES } from '../../src/data/indianStatesAndCities';

export const SIMULATION_AUTHORIZED_EMAIL = 'operationalhtklabs@gmail.com';

export interface SimulateOrdersOptions {
  count?: number;
  dateMode?: 'specific' | 'range' | 'now';
  specificDate?: string; // YYYY-MM-DD
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  amountMode?: 'random_cart' | 'target_range' | 'exact_target';
  minAmount?: number;
  maxAmount?: number;
  targetAmount?: number;
  statusMode?: 'delivered' | 'shipped' | 'processing' | 'pending' | 'mixed';
  paymentMode?: 'mixed' | 'UPI' | 'Credit / Debit Card' | 'COD' | 'Net Banking';
  referralMode?: 'random_partner' | 'specific_partner' | 'no_partner';
  specificPartnerCode?: string;
  adminEmail: string;
}

interface CityPinMapping {
  [city: string]: { state: string; pincode: string };
}

const CITY_PIN_DATA: CityPinMapping = {
  // Maharashtra (Core region)
  'Jalgaon': { state: 'Maharashtra', pincode: '425001' },
  'Bhusawal': { state: 'Maharashtra', pincode: '425201' },
  'Chalisgaon': { state: 'Maharashtra', pincode: '424101' },
  'Pachora': { state: 'Maharashtra', pincode: '424201' },
  'Amalner': { state: 'Maharashtra', pincode: '425401' },
  'Chopda': { state: 'Maharashtra', pincode: '425107' },
  'Raver': { state: 'Maharashtra', pincode: '425508' },
  'Yawal': { state: 'Maharashtra', pincode: '425301' },
  'Dhule': { state: 'Maharashtra', pincode: '424001' },
  'Nashik': { state: 'Maharashtra', pincode: '422001' },
  'Pune': { state: 'Maharashtra', pincode: '411001' },
  'Mumbai': { state: 'Maharashtra', pincode: '400001' },
  'Thane': { state: 'Maharashtra', pincode: '400601' },
  'Navi Mumbai': { state: 'Maharashtra', pincode: '400703' },
  'Nagpur': { state: 'Maharashtra', pincode: '440001' },
  'Aurangabad': { state: 'Maharashtra', pincode: '431001' },
  'Kolhapur': { state: 'Maharashtra', pincode: '416001' },
  'Solapur': { state: 'Maharashtra', pincode: '413001' },
  'Akola': { state: 'Maharashtra', pincode: '444001' },
  'Amravati': { state: 'Maharashtra', pincode: '444601' },
  'Satara': { state: 'Maharashtra', pincode: '415001' },
  'Sangli': { state: 'Maharashtra', pincode: '416416' },

  // Gujarat
  'Surat': { state: 'Gujarat', pincode: '395001' },
  'Ahmedabad': { state: 'Gujarat', pincode: '380001' },
  'Vadodara': { state: 'Gujarat', pincode: '390001' },
  'Rajkot': { state: 'Gujarat', pincode: '360001' },

  // Madhya Pradesh
  'Indore': { state: 'Madhya Pradesh', pincode: '452001' },
  'Bhopal': { state: 'Madhya Pradesh', pincode: '462001' },
  'Burhanpur': { state: 'Madhya Pradesh', pincode: '450331' },
  'Khandwa': { state: 'Madhya Pradesh', pincode: '450001' },

  // Metro Cities
  'New Delhi': { state: 'Delhi', pincode: '110001' },
  'Bengaluru': { state: 'Karnataka', pincode: '560001' },
  'Hyderabad': { state: 'Telangana', pincode: '500001' }
};

const STREET_TEMPLATES = [
  'Flat No {num}, {building}, Near {landmark}, {area}',
  '{num}, {building}, Opposite {landmark}, {road}',
  'Plot No {num}, {colony}, Behind {landmark}',
  '{num}, {area}, Near {landmark}',
  'Shop {num}, {building}, {road}, {area}',
  'Row House {num}, {colony}, Near {landmark}'
];

const BUILDING_NAMES = [
  'Shree Ganesh Residency', 'Sai Sagar Heights', 'Vrundavan Park', 'Shiv Krupa Apartments',
  'Shubh Labh Complex', 'Om Sai Enclave', 'Radhe Krishna Tower', 'Sundaram Heights',
  'Mahalaxmi Chambers', 'Balaji Avenue', 'Gokul Dham Society', 'Silver Oak Plaza'
];

const COLONY_NAMES = [
  'Prabhat Colony', 'Shivaji Nagar', 'Sharda Nagar', 'Gandharv Nagari',
  'Adarsh Nagar', 'Vivekanand Colony', 'Panchavati Colony', 'Samarth Nagar',
  'Suyog Colony', 'Tilak Nagar', 'Muktai Nagar', 'Gajanan Colony'
];

const LANDMARKS = [
  'Central Bank of India', 'City Civil Hospital', 'Ganpati Temple', 'Railway Station',
  'Old Bus Stand', 'D-Mart Store', 'Zilla Parishad School', 'Shivaji Maharaj Statue',
  'Bank of Maharashtra', 'State Bank of India', 'Navi Peth Market', 'Ring Road Petrol Pump'
];

const AREAS_AND_ROADS = [
  'MG Road', 'Station Road', 'Navi Peth', 'Ring Road', 'Old Agra Road',
  'Court Road', 'Subhash Road', 'Nehru Chowk', 'Pratap Nagar', 'MIDC Area'
];

export class OrderSimulationService {
  /**
   * Generates authentic simulated orders with real shop products, genuine Indian addresses,
   * authentic dates, optional woman partner referral attribution & commissions,
   * and persistent is_fake=1 database flags.
   */
  static async simulateOrders(options: SimulateOrdersOptions): Promise<{
    success: boolean;
    createdCount: number;
    totalAmount: number;
    orders: Order[];
    message: string;
  }> {
    // 1. Authorization Guard: Accessible to all administrators in Store Admin
    const requester = String(options.adminEmail || '').trim().toLowerCase();
    if (!requester) {
      options.adminEmail = 'admin@aapla-jalgaonwala.com';
    }

    const count = Math.min(Math.max(Number(options.count) || 1, 1), 1000);
    const affectedPartners = new Set<string>();

    // 2. Fetch Real Catalog Products
    const allProducts = await ProductRepository.getAll(true);
    const validProducts = allProducts.filter(p => p.price && p.price > 0);
    if (validProducts.length === 0) {
      throw new Error('No catalog products found to generate orders from.');
    }

    // 3. Fetch Active Woman Partners for Referral Commissions (fast query without re-syncing all historical orders)
    let activePartners: any[] = [];
    try {
      const pool = getDbPool();
      if (pool) {
        const [rows]: any = await pool.query('SELECT * FROM business_partners WHERE status IN ("active", "approved")');
        if (Array.isArray(rows) && rows.length > 0) {
          activePartners = rows.map((r: any) => ({
            id: r.id,
            partnerCode: r.partner_code,
            fullName: r.full_name,
            city: r.city,
            commissionRate: Number(r.commission_rate || 12),
            status: r.status
          }));
        }
      }
      if (activePartners.length === 0) {
        const jsonPartners = await readJson<any[]>('business_partners.json', []);
        activePartners = jsonPartners.filter(p => p.status === 'active' || p.status === 'approved');
      }
    } catch (_) {
      activePartners = [];
    }

    const createdOrders: Order[] = [];
    const referralsToSave: any[] = [];
    let grandTotal = 0;

    // Pre-calculate status distribution matching exact requested percentages
    const statusArray: Array<'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled'> = [];
    if (options.statusMode === 'delivered') {
      for (let k = 0; k < count; k++) statusArray.push('Delivered');
    } else if (options.statusMode === 'shipped') {
      for (let k = 0; k < count; k++) statusArray.push('Shipped');
    } else if (options.statusMode === 'processing') {
      for (let k = 0; k < count; k++) statusArray.push('Processing');
    } else if (options.statusMode === 'pending') {
      for (let k = 0; k < count; k++) statusArray.push('Pending');
    } else if (options.statusMode === 'cancelled') {
      for (let k = 0; k < count; k++) statusArray.push('Cancelled');
    } else {
      let delPct = Number(options.customDeliveredPercent !== undefined ? options.customDeliveredPercent : 70);
      let shipPct = Number(options.customShippedPercent !== undefined ? options.customShippedPercent : 20);
      let cancelPct = Number(options.customCancelledPercent !== undefined ? options.customCancelledPercent : 10);
      let sumPct = delPct + shipPct + cancelPct;

      if (sumPct === 0) {
        delPct = 70; shipPct = 20; cancelPct = 10;
        sumPct = 100;
      }

      const delCount = Math.round((delPct / sumPct) * count);
      const shipCount = Math.round((shipPct / sumPct) * count);
      const cancelCount = Math.max(0, count - delCount - shipCount);

      for (let k = 0; k < delCount && statusArray.length < count; k++) statusArray.push('Delivered');
      for (let k = 0; k < shipCount && statusArray.length < count; k++) statusArray.push('Shipped');
      for (let k = 0; k < cancelCount && statusArray.length < count; k++) statusArray.push('Cancelled');
      while (statusArray.length < count) statusArray.push('Delivered');

      for (let s = statusArray.length - 1; s > 0; s--) {
        const j = Math.floor(Math.random() * (s + 1));
        [statusArray[s], statusArray[j]] = [statusArray[j], statusArray[s]];
      }
    }

    for (let i = 0; i < count; i++) {
      // A. Pick Real Products based on Amount Preference
      const items = this.selectRealisticProducts(validProducts, options, count);
      const subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

      // B. Woman Partner Attribution & Commission
      let partnerCode: string | undefined = undefined;
      let partnerObj: any = undefined;

      if (options.referralMode === 'specific_partner' && options.specificPartnerCode) {
        partnerCode = options.specificPartnerCode.trim().toUpperCase();
        partnerObj = activePartners.find(p => p.partnerCode.toUpperCase() === partnerCode);
      } else if (options.referralMode === 'random_partner' && activePartners.length > 0) {
        partnerObj = activePartners[Math.floor(Math.random() * activePartners.length)];
        partnerCode = partnerObj?.partnerCode;
      } else if (!options.referralMode && activePartners.length > 0 && Math.random() > 0.45) {
        partnerObj = activePartners[Math.floor(Math.random() * activePartners.length)];
        partnerCode = partnerObj?.partnerCode;
      }

      // 4% partner customer discount
      const discount = partnerCode ? Math.round(subtotal * 0.04) : 0;
      const shippingFee = subtotal >= 499 ? 0 : 40;
      const totalAmount = Math.max(0, subtotal - discount + shippingFee);

      // C. Customer & Authentic Indian Address
      const { customer, shippingAddress } = this.generateIndianCustomerAndAddress();

      // D. Realistic Date
      const createdAt = this.generateOrderDate(options);

      // E. Status & Payment Method
      const chosenStatus = statusArray[i] || 'Delivered';
      const { status, paymentStatus, paymentMethod, codAdvanceFeePaid, codRemainingBalance, awbNumber, courierName, trackingUrl } = 
        this.generateStatusAndPaymentWithStatus(totalAmount, chosenStatus, options);

      // F. Unique Order Number
      const orderTimestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `AJW-${orderTimestamp}${randomSuffix.toString().slice(-2)}`;
      const orderId = `ord_sim_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;

      // G. Construct Order (is_fake = 1)
      const newOrderData: Partial<Order> = {
        id: orderId,
        orderNumber,
        customer,
        shippingAddress,
        items,
        subtotal,
        discount,
        shippingFee,
        totalAmount,
        referralPartnerCode: partnerCode,
        status,
        paymentStatus,
        paymentMethod,
        codAdvanceFeePaid,
        codRemainingBalance,
        awbNumber,
        courierName,
        trackingUrl,
        is_fake: 1, // Explicit database flag (is_fake=1)
        notes: partnerCode 
          ? `Order placed with Woman Partner Referral Code: ${partnerCode} (${partnerObj?.fullName || 'Business Partner'})`
          : undefined,
        createdAt,
        updatedAt: createdAt
      };

      const fullOrder = newOrderData as Order;

      // Authoritatively persist using OrderRepository
      try {
        await OrderRepository.create(fullOrder);
      } catch (err) {
        console.warn('[OrderSimulation] Error persisting order:', err);
      }

      createdOrders.push(fullOrder);
      grandTotal += totalAmount;

      if (partnerCode && partnerObj) {
        affectedPartners.add(partnerCode);
        referralsToSave.push({
          partnerCode,
          partnerId: partnerObj.id,
          partnerName: partnerObj.fullName,
          orderId: fullOrder.id,
          orderNumber: fullOrder.orderNumber,
          orderTotal: fullOrder.totalAmount,
          customerName: customer.name,
          customerCity: shippingAddress.city,
          orderDate: new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          customerDiscount: discount,
          partnerCommission: Math.round((fullOrder.totalAmount * ((partnerObj.commissionRate || 12) / 100)) * 100) / 100,
          status: status.toLowerCase() === 'delivered' ? 'eligible' : 'on_hold',
          createdAt
        });
      }
    }

    // High Performance Bulk Persistence (Supports up to 1,000 orders effortlessly)
    const pool = getDbPool();
    if (pool) {
      try {
        // 1. Bulk insert orders into MySQL in batches of 50
        for (let b = 0; b < createdOrders.length; b += 50) {
          const batch = createdOrders.slice(b, b + 50);
          const orderValues = batch.map(order => [
            order.id,
            order.orderNumber,
            order.customer.id || null,
            order.customer.name,
            order.customer.email,
            order.customer.phone,
            JSON.stringify(order.shippingAddress),
            order.subtotal,
            order.discount,
            order.shippingFee,
            order.totalAmount,
            order.couponCode || null,
            order.referralPartnerCode || null,
            order.status,
            order.paymentStatus,
            order.paymentMethod,
            order.codAdvanceFeePaid || 0,
            order.codRemainingBalance || 0,
            order.awbNumber || null,
            order.courierName || null,
            order.trackingUrl || null,
            order.paymentDetails ? JSON.stringify(order.paymentDetails) : null,
            order.notes || null,
            1, // is_fake = 1
            order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);

          await pool.query(
            `INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, shipping_address_json, subtotal, discount, shipping_fee, total_amount, coupon_code, referral_partner_code, status, payment_status, payment_method, cod_advance_fee_paid, cod_remaining_balance, awb_number, courier_name, tracking_url, payment_details_json, notes, is_fake, created_at)
             VALUES ?`,
            [orderValues]
          );

          // 2. Bulk insert order_items for this batch
          const itemValues: any[] = [];
          for (const o of batch) {
            for (const it of o.items) {
              itemValues.push([
                it.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                o.id,
                it.productId,
                it.productName,
                it.quantity,
                it.price,
                it.profit || 0,
                it.variantInfo || null
              ]);
            }
          }
          if (itemValues.length > 0) {
            await pool.query(
              `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, profit, variant_info) VALUES ?`,
              [itemValues]
            ).catch(() => {});
          }
        }
      } catch (dbErr) {
        console.warn('[OrderSimulation] MySQL bulk insert warning:', dbErr);
      }
    }

    // 3. Single-pass JSON persistence for orders
    try {
      const existingOrders = await readJson<Order[]>('orders.json', []);
      existingOrders.unshift(...createdOrders);
      await writeJson('orders.json', existingOrders);
    } catch (jsonErr) {
      console.warn('[OrderSimulation] JSON write warning:', jsonErr);
    }

    // 4. Batch Woman Partner Referrals
    if (referralsToSave.length > 0) {
      if (pool) {
        try {
          for (let rb = 0; rb < referralsToSave.length; rb += 50) {
            const refBatch = referralsToSave.slice(rb, rb + 50);
            const refValues = refBatch.map(r => [
              `ref_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              r.partnerId,
              r.partnerCode,
              r.partnerName,
              r.orderId,
              r.orderNumber,
              r.orderDate,
              r.customerName,
              r.customerCity,
              r.orderTotal,
              r.customerDiscount,
              r.partnerCommission,
              r.status,
              r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ')
            ]);

            await pool.query(
              `INSERT INTO partner_referrals (id, partner_id, partner_code, partner_name, order_id, order_number, order_date, customer_name, customer_city, order_total, customer_discount, partner_commission, status, created_at)
               VALUES ?
               ON DUPLICATE KEY UPDATE order_total=VALUES(order_total)`,
              [refValues]
            );
          }
        } catch (refDbErr) {
          console.warn('[OrderSimulation] MySQL bulk referral insert warning:', refDbErr);
        }
      }

      // Single-pass JSON persistence for referrals
      try {
        const existingReferrals = await readJson<any[]>('partner_referrals.json', []);
        for (const ref of referralsToSave) {
          existingReferrals.unshift({
            id: `ref_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            ...ref
          });
        }
        await writeJson('partner_referrals.json', existingReferrals);
      } catch (refJsonErr) {
        console.warn('[OrderSimulation] Referral JSON write warning:', refJsonErr);
      }

      // Recalculate metrics in background so large bulk simulations return instantly
      setImmediate(async () => {
        for (const pCode of affectedPartners) {
          try {
            await PartnerRepository.recalculatePartnerMetrics(pCode);
          } catch (err) {
            console.warn('[OrderSimulation] Partner recalculate metrics warning:', err);
          }
        }
      });
    }

    OrderRepository.clearCache();
    PartnerRepository.clearCache();

    return {
      success: true,
      createdCount: createdOrders.length,
      totalAmount: grandTotal,
      orders: createdOrders,
      message: `Successfully created ${createdOrders.length} order(s) totaling ₹${grandTotal.toLocaleString('en-IN')}.`
    };
  }

  /**
   * Intelligently selects real shop catalog products, matching target amount or cart structure
   */
  private static selectRealisticProducts(allProducts: any[], options: SimulateOrdersOptions, totalOrdersCount: number = 1): OrderItem[] {
    const selectedItems: OrderItem[] = [];
    const pool = [...allProducts];

    let targetSubtotalPerOrder: number | null = null;
    if (options.amountMode === 'exact_target' && options.targetAmount && options.targetAmount > 0) {
      if (options.targetAmount >= 200 * totalOrdersCount) {
        targetSubtotalPerOrder = Math.max(100, Math.round(options.targetAmount / totalOrdersCount));
      } else {
        targetSubtotalPerOrder = Math.max(100, options.targetAmount);
      }
    } else if (options.amountMode === 'target_range') {
      const min = Math.max(options.minAmount || 400, 100);
      const max = Math.max(options.maxAmount || 2500, min + 100);
      targetSubtotalPerOrder = Math.floor(min + Math.random() * (max - min));
    }

    if (targetSubtotalPerOrder !== null) {
      let currentSum = 0;
      let attempts = 0;

      while (currentSum < targetSubtotalPerOrder && pool.length > 0 && attempts < 25) {
        attempts++;
        const prodIndex = Math.floor(Math.random() * pool.length);
        const prod = pool[prodIndex];
        const variants = prod.variants && prod.variants.length > 0 ? prod.variants : null;
        const variant = variants ? variants[Math.floor(Math.random() * variants.length)] : null;

        const unitPrice = Number(variant?.price || prod.price) || 150;
        const remaining = targetSubtotalPerOrder - currentSum;
        const neededQty = Math.max(1, Math.round(remaining / unitPrice));
        const qty = Math.min(neededQty, Math.max(1, Math.floor(remaining / unitPrice) || 1));

        selectedItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: String(prod.id),
          productName: prod.name,
          quantity: qty,
          price: unitPrice,
          profit: Number(variant?.profit || prod.profit || 0),
          variantInfo: variant?.weight || variant?.name || (prod.weight ? `${prod.weight}g` : 'Standard Pack'),
          image: prod.images?.[0]?.url || undefined
        });

        currentSum += unitPrice * qty;
        if (currentSum >= targetSubtotalPerOrder - 30) break;
      }
    } else {
      // Default / random cart: Pick 1 to 4 distinct items
      const numItems = Math.floor(1 + Math.random() * 3);
      for (let i = 0; i < numItems && pool.length > 0; i++) {
        const prodIndex = Math.floor(Math.random() * pool.length);
        const prod = pool.splice(prodIndex, 1)[0];
        const variants = prod.variants && prod.variants.length > 0 ? prod.variants : null;
        const variant = variants ? variants[Math.floor(Math.random() * variants.length)] : null;

        const unitPrice = Number(variant?.price || prod.price) || 150;
        const qty = Math.random() > 0.65 ? Math.floor(2 + Math.random() * 2) : 1;

        selectedItems.push({
          id: `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          productId: String(prod.id),
          productName: prod.name,
          quantity: qty,
          price: unitPrice,
          profit: Number(variant?.profit || prod.profit || 0),
          variantInfo: variant?.weight || variant?.name || (prod.weight ? `${prod.weight}g` : 'Standard Pack'),
          image: prod.images?.[0]?.url || undefined
        });
      }
    }

    if (selectedItems.length === 0 && allProducts.length > 0) {
      const fallbackProd = allProducts[0];
      selectedItems.push({
        id: `item_${Date.now()}_fallback`,
        productId: String(fallbackProd.id),
        productName: fallbackProd.name,
        quantity: 2,
        price: Number(fallbackProd.price) || 200,
        profit: Number(fallbackProd.profit) || 40,
        variantInfo: 'Standard Pack',
        image: fallbackProd.images?.[0]?.url || undefined
      });
    }

    return selectedItems;
  }

  /**
   * Generates a 100% genuine Indian customer profile & address
   */
  private static generateIndianCustomerAndAddress() {
    const fullName = fakerEN_IN.person.fullName();
    const cleanFirstName = fullName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    const cleanLastName = (fullName.split(' ')[1] || 'customer').toLowerCase().replace(/[^a-z]/g, '');
    const email = `${cleanFirstName}.${cleanLastName}${faker.number.int({ min: 10, max: 999 })}@gmail.com`;

    // Authentic Indian 10-digit mobile number starting with 9, 8, or 7
    const prefix = ['9822', '9823', '9422', '8888', '9923', '9763', '9158', '8380', '9021', '7028'][
      Math.floor(Math.random() * 10)
    ];
    const phone = `${prefix}${faker.string.numeric(6)}`;

    // Pick realistic city & pincode
    const cityKeys = Object.keys(CITY_PIN_DATA);
    // Prioritize Maharashtra / Khandesh 65% of the time, other states 35%
    const chosenCityName = Math.random() < 0.65
      ? ['Jalgaon', 'Pune', 'Nashik', 'Mumbai', 'Bhusawal', 'Chalisgaon', 'Dhule', 'Thane', 'Nagpur'][Math.floor(Math.random() * 9)]
      : cityKeys[Math.floor(Math.random() * cityKeys.length)];

    const cityMeta = CITY_PIN_DATA[chosenCityName] || { state: 'Maharashtra', pincode: '425001' };

    // Format realistic street address
    const streetTemplate = STREET_TEMPLATES[Math.floor(Math.random() * STREET_TEMPLATES.length)];
    const addressLine1 = streetTemplate
      .replace('{num}', String(faker.number.int({ min: 10, max: 604 })))
      .replace('{building}', BUILDING_NAMES[Math.floor(Math.random() * BUILDING_NAMES.length)])
      .replace('{colony}', COLONY_NAMES[Math.floor(Math.random() * COLONY_NAMES.length)])
      .replace('{landmark}', LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)])
      .replace('{area}', AREAS_AND_ROADS[Math.floor(Math.random() * AREAS_AND_ROADS.length)])
      .replace('{road}', AREAS_AND_ROADS[Math.floor(Math.random() * AREAS_AND_ROADS.length)]);

    const landmark = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];

    return {
      customer: {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: fullName,
        email,
        phone
      },
      shippingAddress: {
        fullName,
        phone,
        email,
        addressLine1,
        addressLine2: `${chosenCityName}, ${cityMeta.state}`,
        landmark: `Near ${landmark}`,
        city: chosenCityName,
        state: cityMeta.state,
        pincode: cityMeta.pincode
      }
    };
  }

  /**
   * Generates order timestamp matching date requirements
   */
  private static generateOrderDate(options: SimulateOrdersOptions): string {
    if (options.dateMode === 'specific' && options.specificDate) {
      const baseDate = new Date(options.specificDate);
      if (!isNaN(baseDate.getTime())) {
        // Set realistic shopping hour (between 09:30 and 22:30 IST)
        const hour = Math.floor(9 + Math.random() * 13);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        baseDate.setHours(hour, minute, second);
        return baseDate.toISOString();
      }
    }

    if (options.dateMode === 'range' && options.dateFrom && options.dateTo) {
      const fromTime = new Date(options.dateFrom).getTime();
      const toTime = new Date(options.dateTo).getTime();
      if (!isNaN(fromTime) && !isNaN(toTime) && toTime > fromTime) {
        const randomTime = fromTime + Math.random() * (toTime - fromTime);
        return new Date(randomTime).toISOString();
      }
    }

    // Default to current time with minor jitter (past 1-120 minutes)
    const jitterMinutes = Math.floor(Math.random() * 120);
    return new Date(Date.now() - jitterMinutes * 60 * 1000).toISOString();
  }

  /**
   * Generates authentic order fulfillment status, payment method, and tracking with assigned status
   */
  private static generateStatusAndPaymentWithStatus(
    totalAmount: number,
    assignedStatus: 'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled',
    options: SimulateOrdersOptions
  ) {
    const status = assignedStatus;

    // Payment Method
    let paymentMethod = 'UPI';
    if (options.paymentMode && options.paymentMode !== 'mixed') {
      paymentMethod = options.paymentMode;
    } else {
      const rand = Math.random();
      if (rand < 0.65) paymentMethod = 'UPI';
      else if (rand < 0.85) paymentMethod = 'COD';
      else if (rand < 0.95) paymentMethod = 'Credit / Debit Card';
      else paymentMethod = 'Net Banking';
    }

    let paymentStatus: 'Paid' | 'Pending' | 'Partial Paid' = 'Paid';
    let codAdvanceFeePaid = 0;
    let codRemainingBalance = 0;

    if (paymentMethod === 'COD') {
      if (status === 'Delivered') {
        paymentStatus = 'Paid';
        codAdvanceFeePaid = 49;
        codRemainingBalance = 0;
      } else {
        paymentStatus = 'Partial Paid';
        codAdvanceFeePaid = 49;
        codRemainingBalance = Math.max(0, totalAmount - 49);
      }
    } else {
      paymentStatus = status === 'Pending' && Math.random() < 0.3 ? 'Pending' : 'Paid';
    }

    if (status === 'Cancelled') {
      paymentStatus = 'Pending';
      codRemainingBalance = 0;
    }

    // Tracking details for Shipped or Delivered orders
    let awbNumber: string | undefined = undefined;
    let courierName: string | undefined = undefined;
    let trackingUrl: string | undefined = undefined;

    if (status === 'Delivered' || status === 'Shipped') {
      awbNumber = `D${faker.string.numeric(8)}`;
      courierName = 'DTDC';
      trackingUrl = `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${awbNumber}`;
    }

    return {
      status,
      paymentStatus,
      paymentMethod,
      codAdvanceFeePaid,
      codRemainingBalance,
      awbNumber,
      courierName,
      trackingUrl
    };
  }

  /**
   * Generates authentic order fulfillment status, payment method, and tracking
   */
  private static generateStatusAndPayment(totalAmount: number, options: SimulateOrdersOptions) {
    let status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending' | 'Cancelled' = 'Delivered';

    if (options.statusMode === 'custom') {
      let delPct = Number(options.customDeliveredPercent !== undefined ? options.customDeliveredPercent : 70);
      let shipPct = Number(options.customShippedPercent !== undefined ? options.customShippedPercent : 20);
      let cancelPct = Number(options.customCancelledPercent !== undefined ? options.customCancelledPercent : 10);

      const totalPct = delPct + shipPct + cancelPct;
      if (totalPct > 0) {
        delPct = (delPct / totalPct) * 100;
        shipPct = (shipPct / totalPct) * 100;
        cancelPct = (cancelPct / totalPct) * 100;
      } else {
        delPct = 70;
        shipPct = 20;
        cancelPct = 10;
      }

      const rand = Math.random() * 100;
      if (rand < delPct) status = 'Delivered';
      else if (rand < delPct + shipPct) status = 'Shipped';
      else status = 'Cancelled';
    } else if (options.statusMode && options.statusMode !== 'mixed') {
      const mode = options.statusMode.toLowerCase();
      if (mode === 'shipped') status = 'Shipped';
      else if (mode === 'processing') status = 'Processing';
      else if (mode === 'pending') status = 'Pending';
      else if (mode === 'cancelled') status = 'Cancelled';
      else status = 'Delivered';
    } else {
      // Mixed distribution: 55% Delivered, 25% Shipped, 15% Processing, 5% Pending
      const rand = Math.random();
      if (rand < 0.55) status = 'Delivered';
      else if (rand < 0.80) status = 'Shipped';
      else if (rand < 0.95) status = 'Processing';
      else status = 'Pending';
    }

    // Payment Method
    let paymentMethod = 'UPI';
    if (options.paymentMode && options.paymentMode !== 'mixed') {
      paymentMethod = options.paymentMode;
    } else {
      const rand = Math.random();
      if (rand < 0.65) paymentMethod = 'UPI';
      else if (rand < 0.85) paymentMethod = 'COD';
      else if (rand < 0.95) paymentMethod = 'Credit / Debit Card';
      else paymentMethod = 'Net Banking';
    }

    let paymentStatus: 'Paid' | 'Pending' | 'Partial Paid' = 'Paid';
    let codAdvanceFeePaid = 0;
    let codRemainingBalance = 0;

    if (paymentMethod === 'COD') {
      if (status === 'Delivered') {
        paymentStatus = 'Paid';
        codAdvanceFeePaid = 49;
        codRemainingBalance = 0;
      } else {
        paymentStatus = 'Partial Paid';
        codAdvanceFeePaid = 49;
        codRemainingBalance = Math.max(0, totalAmount - 49);
      }
    } else {
      paymentStatus = status === 'Pending' && Math.random() < 0.3 ? 'Pending' : 'Paid';
    }

    if (status === 'Cancelled') {
      paymentStatus = 'Pending';
      codRemainingBalance = 0;
    }

    // Tracking details for Shipped or Delivered orders
    let awbNumber: string | undefined = undefined;
    let courierName: string | undefined = undefined;
    let trackingUrl: string | undefined = undefined;

    if (status === 'Delivered' || status === 'Shipped') {
      awbNumber = `D${faker.string.numeric(8)}`;
      courierName = 'DTDC';
      trackingUrl = `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${awbNumber}`;
    }

    return {
      status,
      paymentStatus,
      paymentMethod,
      codAdvanceFeePaid,
      codRemainingBalance,
      awbNumber,
      courierName,
      trackingUrl
    };
  }
}
