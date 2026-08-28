'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/create-payment',
      handler: 'order.pay',
      config: {
        auth: false,
      },
    },
  ],
};