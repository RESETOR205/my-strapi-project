'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/checkout/oxapay', // <-- Уникальное имя, чтобы Strapi не путался
      handler: 'payment.createInvoice',
      config: {
        auth: false,
      },
    },
  ],
};