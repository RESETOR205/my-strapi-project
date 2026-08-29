'use strict';

module.exports = {
  async create(ctx) {
    try {
      // Получаем данные, которые прислала наша корзина
      const { amount, orderId, email, userId, models } = ctx.request.body;

      // ТВОЙ КЛЮЧ: Замени эту строку на свой реальный Merchant API Key из OxaPay!
      const merchantKey = 'ТВОЙ_КЛЮЧ_OXAPAY'; 

      // Отправляем запрос к API OxaPay на создание счета
      const response = await fetch('https://api.oxapay.com/merchants/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchant: merchantKey,
          amount: amount,
          currency: 'USD',
          lifeTime: 60, // Время жизни ссылки в минутах
          returnUrl: 'https://www.knighthubs.xyz/success.html', // Куда вернуть покупателя после оплаты
          callbackUrl: 'https://api.knighthubs.xyz/api/payments/webhook', // Для будущего вебхука
          description: `Order ${orderId}`,
          orderId: orderId,
          email: email
        })
      });

      const data = await response.json();

      // OxaPay возвращает result: 100 в случае успеха
      if (data.result === 100) {
        return ctx.send({ 
          success: true, 
          payLink: data.payLink 
        });
      } else {
        return ctx.badRequest(data.message || 'Ошибка генерации инвойса в OxaPay');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      return ctx.internalServerError('Ошибка на стороне сервера платежей');
    }
  }
};