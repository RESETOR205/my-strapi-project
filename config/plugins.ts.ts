export default ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'твой_email@gmail.com',        // Твоя почта Gmail
          pass: 'xxxx xxxx xxxx xxxx',          // 16-значный пароль приложения Google
        },
      },
      settings: {
        defaultFrom: 'твой_email@gmail.com',
        defaultReplyTo: 'твой_email@gmail.com',
      },
    },
  },
});