'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/oxapay/checkout', // <-- Изменили название, чтобы уйти от конфликта с :id
      handler: 'payment.createInvoice',
      config: {
        auth: false,
      },
    },
  ],
};