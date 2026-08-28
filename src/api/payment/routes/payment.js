'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/oxapay/checkout', // <-- Сделали полностью уникальный путь, чтобы Strapi не путался
      handler: 'api::payment.payment.createInvoice', // <-- Явно указываем Strapi, где лежит функция
      config: {
        auth: false, // Отключаем проверку прав
        policies: [],
        middlewares: [],
      },
    },
  ],
};