'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment/create',
      handler: 'payment.createInvoice',
      config: {
        auth: false, // Отключает админку и делает маршрут публичным
      },
    },
  ],
};