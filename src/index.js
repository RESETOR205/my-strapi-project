'use strict';
// Используем встроенный модуль Node.js, который не требует установки и не крашит сервер!
const https = require('https'); 

module.exports = {
  register({ strapi }) {
    // Перехватчик, который срабатывает ДО любых внутренних правил Strapi
    strapi.server.use(async (ctx, next) => {
      
      if (ctx.path === '/api/oxapay-checkout') {
        
        // 1. Вручную пропускаем CORS (браузерную защиту)
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Отвечаем на проверочный запрос браузера
        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return;
        }

        // 2. Обработка самой оплаты
        if (ctx.method === 'POST') {
          try {
            // Читаем данные напрямую из потока, так как Strapi еще не успел их обработать
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

            // Подготавливаем данные для OxaPay
            const oxapayData = JSON.stringify({
              merchant: process.env.OXAPAY_MERCHANT_KEY, // твой ключ из админки Railway
              amount: Number(amount),
              currency: 'USD',
              order_id: String(orderId),
              email: email || 'support@knighthubs.xyz',
              return_url: 'https://www.knighthubs.xyz/user.html',
              description: `Order #${orderId} on Knight Hub`
            });

            // Делаем встроенный HTTPS-запрос (вместо axios)
            const responseData = await new Promise((resolve, reject) => {
              const req = https.request('https://api.oxapay.com/merchants/request', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(oxapayData)
                }
              }, (res) => {
                let resData = '';
                res.on('data', chunk => { resData += chunk; });
                res.on('end', () => {
                  try { resolve(JSON.parse(resData)); } catch(e) { reject(e); }
                });
              });
              
              req.on('error', reject);
              req.write(oxapayData);
              req.end();
            });

            // Отдаем результат фронтенду
            if (responseData && (responseData.result === 100 || responseData.payLink)) {
              ctx.status = 200;
              ctx.body = { success: true, payLink: responseData.payLink };
            } else {
              ctx.status = 400;
              ctx.body = { error: responseData.message || 'Payment failed' };
            }
          } catch (err) {
            console.error('Payment Error:', err);
            ctx.status = 500;
            ctx.body = { error: 'Server error' };
          }
          
          return; // Завершаем выполнение, Strapi не успеет выдать 405
        }
      }
      
      // Если это не путь оплаты — отдаем запрос дальше в Strapi
      await next();
    });
  },

  bootstrap(/*{ strapi }*/) {},
};