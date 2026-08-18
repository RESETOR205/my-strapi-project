module.exports = {
  routes [
    {
      method 'POST',
      path 'paymentscreate-invoice',
      handler 'payment.createInvoice',
      config {
        auth false,  Разрешаем гостям создавать счет
      },
    },
    {
      method 'POST',
      path 'paymentswebhook',
      handler 'payment.webhook',
      config {
        auth false,  Вебхук от OxaPay приходит без токена пользователя
      },
    },
  ],
};