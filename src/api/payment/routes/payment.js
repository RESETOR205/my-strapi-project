'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment/create',
      handler: 'payment.createInvoice',
      config: {
        auth: false, // <--- Вот эта магия отключает проверку прав
        policies: [],
        middlewares: [],
      },
    },
  ],
};