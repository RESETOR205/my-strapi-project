module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/email-auth/send',
      handler: 'email-auth.sendCode',
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/email-auth/verify',
      handler: 'email-auth.verifyCode',
      config: { auth: false }
    }
  ]
};