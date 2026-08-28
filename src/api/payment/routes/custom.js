'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/oxapay/pay', // Короткий и понятный путь
      handler: 'api::payment.payment.createInvoice', // Точное указание на контроллер
      config: {
        auth: false, // Полностью открытый доступ
      },
    },
  ],
};