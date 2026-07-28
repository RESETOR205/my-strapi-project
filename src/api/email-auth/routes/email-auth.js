module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/email-auth/send',
      handler: 'api::email-auth.email-auth.sendCode', // <-- ВОТ ЗДЕСЬ БЫЛА ОШИБКА
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/email-auth/verify',
      handler: 'api::email-auth.email-auth.verifyCode', // <-- И ЗДЕСЬ
      config: { auth: false }
    }
  ]
};