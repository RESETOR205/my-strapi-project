'use strict';

export default {
  async create(ctx) {
    try {
      const { amount, orderId, email, userId, models } = ctx.request.body;
      const merchantKey = '3EX6UD-FKGFM1-NY59AK-C3RWVD'; 

      const response = await fetch('https://api.oxapay.com/merchants/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchant: merchantKey,
          amount: amount,
          currency: 'USD',
          lifeTime: 60,
          returnUrl: 'https://www.knighthubs.xyz/success.html',
          callbackUrl: 'https://api.knighthubs.xyz/api/payments/webhook',
          description: `Order ${orderId}`,
          orderId: orderId,
          email: email
        })
      });

      const data = await response.json();

      if (data.result === 100) {
        return ctx.send({ success: true, payLink: data.payLink });
      } else {
        return ctx.badRequest(data.message || 'Ошибка генерации инвойса в OxaPay');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      return ctx.internalServerError('Ошибка на стороне сервера платежей');
    }
  }
};