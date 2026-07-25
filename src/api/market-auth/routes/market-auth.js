module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/market/register',
      handler: 'market-auth.register',
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/market/verify',
      handler: 'market-auth.verify',
      config: { auth: false }
    }
  ]
};