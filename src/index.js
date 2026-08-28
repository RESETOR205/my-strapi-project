'use strict';

module.exports = {
  register({ strapi }) {
    // Железобетонный перехватчик: ловит запрос ДО любых проверок Strapi
    strapi.server.use(async (ctx, next) => {
      
      // Ловим ТОЧНОЕ совпадение пути: /pay (без всяких /api/)
      if (ctx.path === '/pay') {
        
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return;
        }

        if (ctx.method === 'POST') {
          try {
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

            // Родной fetch, работает без библиотек
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
                description: `Order #${orderId}`
              })
            });

            const data = await response.json();
            if (data && (data.result === 100 || data.payLink)) {
              ctx.status = 200;
              ctx.body = { success: true, payLink: data.payLink };
            } else {
              ctx.status = 400;
              ctx.body = { error: data.message || 'Payment failed' };
            }
          } catch (err) {
            console.error('Payment Error:', err);
            ctx.status = 500;
            ctx.body = { error: 'Server error' };
          }
          return; // Остановка! Дальше в Strapi запрос не пойдет.
        }
      }
      await next();
    });
  },
  bootstrap() {},
};