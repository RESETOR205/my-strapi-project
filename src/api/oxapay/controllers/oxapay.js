'use strict';

module.exports = {
  async pay(ctx) {
    try {
      const { amount, orderId, email } = ctx.request.body;

      if (!amount || !orderId) {
        return ctx.badRequest('Amount and orderId are required');
      }

      // Используем родной fetch из Node 20. Сервер не упадет.
      const response = await fetch('https://api.oxapay.com/merchants/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: process.env.OXAPAY_MERCHANT_KEY,
          amount: Number(amount),
          currency: 'USD',
          order_id: String(orderId),
          email: email || 'support@knighthubs.xyz',
          return_url: 'https://www.knighthubs.xyz/user.html',
          description: `Order #${orderId} on Knight Hub`
        })
      });

      const data = await response.json();

      if (data && (data.result === 100 || data.payLink)) {
        return ctx.send({ success: true, payLink: data.payLink });
      } else {
        return ctx.badRequest(data.message || 'Payment failed');
      }
    } catch (err) {
      console.error('OxaPay Error:', err);
      return ctx.internalServerError('Payment service error');
    }
  }
};