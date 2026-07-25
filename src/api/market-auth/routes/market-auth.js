module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/market-auth/register',
      handler: 'market-auth.register',
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/market-auth/verify',
      handler: 'market-auth.verify',
      config: { auth: false }
    }
  ]
};