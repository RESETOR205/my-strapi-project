'use strict';

module.exports = {
  routes: [
    {
      method: 'POST', // Важно! Разрешаем именно POST-запросы
      path: '/payments/create',
      handler: 'payment.create',
      config: {
        auth: false, // Разрешаем оплату даже неавторизованным (если нужно)
      },
    },
  ],
};