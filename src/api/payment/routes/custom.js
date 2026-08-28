'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/pay-now', // Короткий путь прямо в корне сервера
      handler: 'api::payment.payment.createInvoice',
      config: {
        auth: false, // Отключаем проверку токенов
        prefix: false // ВЫКЛЮЧАЕМ префикс /api/. Strapi сюда больше не лезет.
      },
    },
  ],
};