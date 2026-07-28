module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/email-auth/send',
      handler: 'api::email-auth.email-auth.sendCode', // <-- ВОТ ТЕПЕРЬ ТУТ ПРАВИЛЬНЫЙ КОД ДЛЯ STRAPI v4
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/email-auth/verify',
      handler: 'api::email-auth.email-auth.verifyCode', // <-- И ЗДЕСЬ ТОЖЕ
      config: { auth: false }
    }
  ]
};