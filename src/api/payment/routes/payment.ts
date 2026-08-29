export default {
  routes: [
    {
      method: 'POST',
      path: '/payments/create',
      handler: 'payment.create',
      config: {
        auth: false,
      },
    },
  ],
};