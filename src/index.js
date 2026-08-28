'use strict';
const axios = require('axios');

module.exports = {
  register({ strapi }) {
    // Безопасный перехватчик: работает поверх всего и не ломает сервер
    strapi.server.use(async (ctx, next) => {
      // Используем гибкую проверку пути (includes), чтобы точно поймать запрос
      if (ctx.path.includes('/oxapay-checkout')) {
        
        // 1. Вручную выдаем зеленый свет для браузера (CORS)
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Отбиваем проверочный запрос браузера, не пуская его дальше
        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return;
        }

        // 2. Сама оплата
        if (ctx.method === 'POST') {
          try {
            // Strapi уже собрал тело запроса, берем его готовым
            const body = ctx.request.body || {};
            const { amount, orderId, email } = body;

            if (!amount || !orderId) {
              ctx.status = 400;
              ctx.body = { error: 'Amount and orderId are required' };
              return;
            }

            // Отправляем запрос в OxaPay
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
              ctx.status = 200;
              ctx.body = { success: true, payLink: response.data.payLink };
            } else {
              ctx.status = 400;
              ctx.body = { error: response.data.message || 'Payment failed' };
            }
          } catch (err) {
            console.error('OxaPay Error:', err);
            ctx.status = 500;
            ctx.body = { error: 'Server error' };
          }
          // Останавливаем выполнение. Strapi никогда не выдаст 405.
          return;
        }
      }
      
      // Все остальные запросы идут стандартным путем
      await next();
    });
  },

  bootstrap(/*{ strapi }*/) {},
};