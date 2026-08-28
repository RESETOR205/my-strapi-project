'use strict';
const axios = require('axios'); // Используем надежный axios вместо fetch

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

      // Запрос к OxaPay через axios
      const response = await axios.post('https://api.oxapay.com/merchants/request', payload);
      const data = response.data;

      if (data.result === 100 || data.payLink) {
        return ctx.send({
          success: true,
          payLink: data.payLink,
          trackId: data.trackId
        });
      } else {
        return ctx.badRequest(data.message || 'Failed to create payment invoice');
      }

    } catch (err) {
      console.error('OxaPay Error:', err);
      return ctx.internalServerError('Payment service error');
    }
  }
};