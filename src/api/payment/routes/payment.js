'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment/create',
      handler: 'payment.createInvoice',
      config: {
        auth: false, // <--- Вот это делает маршрут публичным без админки
        policies: [],
        middlewares: [],
      },
    },
  ],
};