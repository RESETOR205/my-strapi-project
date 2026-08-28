'use strict';

module.exports = {
  async createInvoice(ctx) {
    try {
      const { amount, orderId, email } = ctx.request.body;

      if (!amount || !orderId) {
        return ctx.badRequest('Amount and orderId are required');
      }

      const payload = {
        merchant: process.env.OXAPAY_MERCHANT_KEY,
        amount: Number(amount),
        currency: 'USD',
        order_id: String(orderId),
        email: email || 'support@knighthubs.xyz',
        return_url: 'https://www.knighthubs.xyz/user.html',
        description: `Order #${orderId} on Knight Hub`
      };

      const response = await fetch('https://api.oxapay.com/merchants/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.result === 100 || data.payLink) {
        return ctx.send({
          success: true,
          payLink: data.payLink,
          trackId: data.trackId
        });
      } else {
        return ctx.badRequest({
          message: data.message || 'Failed to create payment invoice'
        });
      }

    } catch (err) {
      return ctx.internalServerError('Payment service error: ' + err.message);
    }
  }
};