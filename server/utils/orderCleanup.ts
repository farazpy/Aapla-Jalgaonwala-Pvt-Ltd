import { OrderRepository } from '../repositories/OrderRepository';

/**
 * Periodically deletes pending orders after 10 minutes if:
 * - They are COD but the partial advance payment is not paid (i.e. paymentStatus is not 'Partial Paid' or 'Paid')
 * - They are Razorpay but payment is not done (i.e. paymentStatus is not 'Paid' or 'Partial Paid')
 *
 * Keeps only real orders with 'Partial Paid' or 'Paid' status.
 */
export async function cleanupPendingOrders() {
  try {
    const orders = await OrderRepository.getAll();
    const now = Date.now();
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    let deletedCount = 0;

    for (const order of orders) {
      if (order.status === 'Pending') {
        const createdTime = new Date(order.createdAt).getTime();

        // Check if the pending order was created more than 10 minutes ago
        if (now - createdTime > TEN_MINUTES_MS) {
          const isPaid = order.paymentStatus === 'Paid';
          const isPartialPaid = order.paymentStatus === 'Partial Paid';

          // If neither fully paid nor partially paid, it's not a real/valid order
          if (!isPaid && !isPartialPaid) {
            console.log(`[Order Cleanup] Auto-deleting unpaid pending order ${order.orderNumber} (ID: ${order.id}) created at ${order.createdAt}`);
            await OrderRepository.delete(order.id);
            deletedCount++;
          }
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[Order Cleanup] Successfully deleted ${deletedCount} unpaid pending orders.`);
    }
  } catch (error) {
    console.error('[Order Cleanup] Error cleaning up pending orders:', error);
  }
}

/**
 * Initializes the background interval for cleaning up pending orders.
 * Checks every 1 minute to keep the system responsive and ensure minimal database load.
 */
export function initOrderCleanupJob() {
  console.log('[Order Cleanup] Initializing background cleanup job...');

  // Run initial cleanup after a short delay (15 seconds) to allow server startup and DB initialization to settle
  setTimeout(() => {
    cleanupPendingOrders().catch(err => {
      console.error('[Order Cleanup] Error running initial cleanup job:', err);
    });
  }, 15000);

  // Run cleanup every 1 minute
  setInterval(() => {
    cleanupPendingOrders().catch(err => {
      console.error('[Order Cleanup] Error running scheduled cleanup job:', err);
    });
  }, 60 * 1000);
}
