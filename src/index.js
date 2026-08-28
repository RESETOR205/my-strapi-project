'use strict';
const axios = require('axios');

module.exports = {
  register({ strapi }) {
    // Внедряемся в самое начало цепочки сервера, до роутеров Strapi
    strapi.server.use(async (ctx, next) => {
      // Ловим только наш путь
      if (ctx.path === '/api/payment-direct') {
        
        // 1. ВРУЧНУЮ разрешаем CORS, чтобы браузер не выдавал ошибку безопасности
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 2. Отвечаем браузеру на скрытый проверочный запрос (Убивает ошибку 405)
        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return; // Завершаем, Strapi это не увидит
        }

        // 3. Обрабатываем саму оплату
        if (ctx.method === 'POST') {
          try {
            // Вручную читаем данные потоком, так как парсер Strapi еще не работал
            const body = await new Promise((resolve) => {
              let data = '';
              ctx.req.on('data', chunk => { data += chunk.toString(); });
              ctx.req.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve({}); }
              });
            });

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

            // Отдаем ссылку на оплату
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
          return; // Завершаем выполнение. Strapi никогда не выдаст 405 для этого запроса.
        }
      }
      
      // Если это не наш путь — отдаем запрос дальше в Strapi
      await next();
    });
  },

  bootstrap(/*{ strapi }*/) {},
};