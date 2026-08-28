'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/process-crypto-payment', // Уникальный путь, 100% нет конфликтов с 405 ошибкой
      handler: 'oxapay.pay',
      config: {
        auth: false,
      },
    },
  ],
};