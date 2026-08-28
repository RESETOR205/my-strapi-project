'use strict';
const axios = require('axios');

module.exports = {
  register({ strapi }) {
    // Вся логика в одном месте! Перехватываем запросы ДО роутера Strapi.
    strapi.server.use(async (ctx, next) => {
      
      // Ловим только наш путь
      if (ctx.path === '/api/oxapay/checkout') {
        
        // 1. Сразу разрешаем CORS, чтобы браузер не ругался
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 2. Отвечаем браузеру на скрытый проверочный запрос (убивает ошибку 405)
        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return; 
        }

        // 3. Сама оплата
        if (ctx.method === 'POST') {
          try {
            // Читаем данные напрямую
            const body = await new Promise((resolve) => {
              let data = '';
              ctx.req.on('data', chunk => { data += chunk.toString(); });
              ctx.req.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
              });
            });

            const { amount, orderId, email } = body;

            if (!amount || !orderId) {
              ctx.status = 400;
              ctx.body = { error: 'Amount and orderId are required' };
              return;
            }

            // Запрос в OxaPay
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
          return; // Завершаем запрос, Strapi его не увидит и не заблокирует
        }
      }
      
      // Все остальные запросы (админка, товары) идут дальше по правилам Strapi
      await next();
    });
  },

  bootstrap(/*{ strapi }*/) {},
};