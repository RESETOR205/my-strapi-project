module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/custom-api/register',
      handler: 'custom-api.register',
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/custom-api/verify',
      handler: 'custom-api.verify',
      config: { auth: false }
    }
  ]
};