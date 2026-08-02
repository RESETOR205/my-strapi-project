export default {
  routes: [
    {
      method: 'POST',
      path: '/email-auth/send',
      handler: 'api::email-auth.email-auth.sendCode',
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/email-auth/verify',
      handler: 'api::email-auth.email-auth.verifyCode',
      config: { auth: false }
    }
  ]
};