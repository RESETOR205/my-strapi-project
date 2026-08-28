'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment/create',
      handler: 'payment.createInvoice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};