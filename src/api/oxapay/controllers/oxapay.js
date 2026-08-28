'use strict';
const https = require('https');

module.exports = {
  async pay(ctx) {
    try {
      const body = ctx.request.body;
      const amount = body.amount;
      const orderId = body.orderId;
      const email = body.email;

      if (!amount || !orderId) {
        return ctx.badRequest('Amount and orderId are required');
      }

      const oxapayData = JSON.stringify({
        merchant: process.env.OXAPAY_MERCHANT_KEY,
        amount: Number(amount),
        currency: 'USD',
        order_id: String(orderId),
        email: email || 'support@knighthubs.xyz',
        return_url: 'https://www.knighthubs.xyz/user.html',
        description: `Order #${orderId} on Knight Hub`
      });

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

      if (responseData && (responseData.result === 100 || responseData.payLink)) {
        return ctx.send({ success: true, payLink: responseData.payLink });
      } else {
        return ctx.badRequest(responseData.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      return ctx.internalServerError('Payment service error');
    }
  }
};