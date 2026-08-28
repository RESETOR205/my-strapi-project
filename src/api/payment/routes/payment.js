'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/oxapay/checkout', 
      handler: 'payment.createInvoice', // Упростили обработчик!
      config: {
        auth: false,
        prefix: false // Эта магия вытаскивает наш путь из-под ограничений /api
      },
    },
  ],
};