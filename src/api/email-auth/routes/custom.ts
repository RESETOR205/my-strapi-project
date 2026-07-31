export default {
  routes: [
    {
      method: 'POST',
      path: '/email-auth/send',
      handler: 'api::email-auth.email-auth.sendCode', // <-- вернул правильную приставку api::
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/email-auth/verify',
      handler: 'api::email-auth.email-auth.verifyCode', // <-- вернул правильную приставку api::
      config: { auth: false }
    }
  ]
};