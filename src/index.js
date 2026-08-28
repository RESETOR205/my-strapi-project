'use strict';
const axios = require('axios');

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    // 1. Отвечаем браузеру на проверку безопасности (CORS Preflight), чтобы убрать ошибку 405
    strapi.server.router.options('/api/oxapay/pay', (ctx) => {
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      ctx.status = 204;
    });

    // 2. Напрямую обрабатываем саму оплату в обход папок routes и controllers
    strapi.server.router.post('/api/oxapay/pay', async (ctx) => {
      ctx.set('Access-Control-Allow-Origin', '*'); // Разрешаем доступ сайту
      
      try {
        const body = ctx.request.body;
        const amount = body.amount;
        const orderId = body.orderId;
        const email = body.email;

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

        const data = response.data;
        if (data.result === 100 || data.payLink) {
          ctx.send({ success: true, payLink: data.payLink, trackId: data.trackId });
        } else {
          ctx.badRequest(data.message || 'Failed to create payment invoice');
        }
      } catch (err) {
        console.error('OxaPay Error:', err);
        ctx.internalServerError('Payment service error');
      }
    });
  },
};