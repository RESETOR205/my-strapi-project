'use strict';
const axios = require('axios');

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    // Официально регистрируем маршрут в ОДНОМ файле, без папок
    strapi.server.routes([
      {
        method: 'POST',
        path: '/oxapay-checkout', // Убрали /api/, чтобы Strapi не лез со своими правилами!
        handler: async (ctx) => {
          try {
            const { amount, orderId, email } = ctx.request.body;

            if (!amount || !orderId) {
              return ctx.badRequest('Amount and orderId are required');
            }

            const response = await axios.post('https://api.oxapay.com/merchants/request', {
              merchant: process.env.OXAPAY_MERCHANT_KEY,
              amount: Number(amount),
              currency: 'USD',
              order_id: String(orderId),
              email: email || 'support@knighthubs.xyz',
              return_url: 'https://www.knighthubs.xyz/user.html',
              description: `Order #${orderId} on Knight Hub`
            });

            if (response.data && (response.data.result === 100 || response.data.payLink)) {
              ctx.send({ success: true, payLink: response.data.payLink });
            } else {
              ctx.badRequest(response.data.message || 'Payment failed');
            }
          } catch (err) {
            console.error('OxaPay Error:', err);
            ctx.internalServerError('Payment service error');
          }
        },
        config: {
          auth: false, // Отключаем проверку токенов
        },
      },
    ]);
  },
};