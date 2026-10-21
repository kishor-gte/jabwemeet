const express = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { sendBookingConfirmationEmail } = require('../utils/mailer');

const router = express.Router();

/**
 * POST /api/payments/webhook
 * Razorpay Payment Webhook Endpoint
 * Ensures bookings & services are reliably confirmed even if user browser disconnects.
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret';

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
    }

    // Verify HMAC SHA256 Signature
    const rawPayload = typeof req.rawBody !== 'undefined' ? req.rawBody : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('⚠️ [Payment Webhook] Invalid signature verification attempt');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    console.log(`💳 [Payment Webhook] Received verified Razorpay event: "${event}"`);

    // Handle payment.captured and order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      if (!paymentEntity) {
        return res.status(200).json({ status: 'ok', message: 'No payment entity in payload' });
      }

      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;
      const amount = paymentEntity.amount ? parseFloat((paymentEntity.amount / 100).toFixed(2)) : 0;
      const notes = paymentEntity.notes || {};
      const { eventId, userId, spots = 1, ticketCode } = notes;

      // 1. Idempotently upsert Payment record
      if (userId) {
        try {
          await prisma.payment.upsert({
            where: { id: 'pay-' + paymentId },
            create: {
              id: 'pay-' + paymentId,
              userId: userId,
              type: eventId ? 'EVENT_BOOKING' : 'SERVICE',
              amount: amount,
              currency: paymentEntity.currency || 'INR',
              status: 'SUCCESS',
              gateway: 'Razorpay',
              referenceId: orderId || paymentId,
              description: `Payment for ${eventId ? 'event booking ' + eventId : 'service'}`,
            },
            update: {
              status: 'SUCCESS',
              referenceId: orderId || paymentId,
            },
          });
        } catch (dbPayErr) {
          console.warn('[Payment Webhook] Note on payment record upsert:', dbPayErr.message);
        }
      }

      // 2. If event booking reference is present, idempotently confirm booking
      if (eventId && userId) {
        const parsedSpots = parseInt(spots, 10) || 1;
        const generatedTicketCode = ticketCode || `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const existingBooking = await prisma.eventBooking.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId,
            },
          },
        });

        if (!existingBooking || existingBooking.status !== 'CONFIRMED') {
          await prisma.eventBooking.upsert({
            where: {
              eventId_userId: {
                eventId,
                userId,
              },
            },
            create: {
              eventId,
              userId,
              spots: parsedSpots,
              totalAmount: amount,
              status: 'CONFIRMED',
            },
            update: {
              status: 'CONFIRMED',
              totalAmount: amount,
              spots: parsedSpots,
            },
          });

          console.log(`✅ [Payment Webhook] Idempotently confirmed booking for user ${userId} on event ${eventId}`);
        }
      }
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Error handling payment webhook:', err);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
});

module.exports = router;
