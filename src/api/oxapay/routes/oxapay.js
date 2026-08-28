'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/oxapay/pay',
      handler: 'oxapay.pay',
      config: {
        auth: false,
      },
    },
  ],
};