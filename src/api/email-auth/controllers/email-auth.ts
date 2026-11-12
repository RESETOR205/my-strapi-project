export default {
  async sendCode(ctx: any) {
    const { username, email, password } = ctx.request.body;

    if (!username || !email || !password) {
      return ctx.badRequest('Пожалуйста, заполните все поля');
    }

    try {
      const emailLower = email.toLowerCase();

      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: emailLower }
      });

      if (existingUser) {
        if (existingUser.confirmed) {
          return ctx.badRequest('Этот Email уже зарегистрирован и подтвержден.');
        }
        await strapi.query('plugin::users-permissions.user').delete({
          where: { id: existingUser.id }
        });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' }
      });

      if (!authenticatedRole) {
        return ctx.badRequest('Ошибка конфигурации: роль Authenticated не найдена');
      }

      const newUser = await strapi.plugin('users-permissions').service('user').add({
        username,
        email: emailLower,
        password,
        confirmed: false,
        provider: 'local',
        confirmationToken: verificationCode,
        role: authenticatedRole.id
      });

      // Отправляем 6-значный код через настроенный плагин Strapi (Resend)
      try {
        await strapi.plugins['email'].services.email.send({
          to: newUser.email,
          from: process.env.SMTP_FROM || 'Knighthubs <noreply@knighthubs.xyz>',
          subject: 'Your Knighthubs Verification Code',
          text: `Welcome to Knighthubs! Your verification code is: ${verificationCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
              <h2>Welcome to Knighthubs!</h2>
              <p>Your 6-digit verification code:</p>
              <h1 style="color: #4CAF50; letter-spacing: 5px;">${verificationCode}</h1>
              <p>Do not share this code with anyone.</p>
            </div>
          `
        });

        console.log(`Письмо с кодом успешно отправлено на ${emailLower}`);
      } catch (emailErr: any) {
        console.error('Ошибка при отправке письма через Resend:', emailErr);
        await strapi.query('plugin::users-permissions.user').delete({ where: { id: newUser.id } });
        return ctx.badRequest('Не удалось отправить письмо. Проверьте почту или попробуйте позже.');
      }

      return ctx.send({ message: 'Код успешно сгенерирован', ok: true });
    } catch (err) {
      console.error('Ошибка в sendCode:', err);
      return ctx.badRequest('Произошла внутренняя ошибка');
    }
  },

  async verifyCode(ctx: any) {
    const { email, code } = ctx.request.body;

    if (!email || !code) {
      return ctx.badRequest('Email и код обязательны');
    }

    try {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase(), confirmationToken: code }
      });

      if (!user) {
        return ctx.badRequest('Неверный код');
      }

      const updatedUser = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmed: true, confirmationToken: null }
      });

      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return ctx.send({ jwt, user: updatedUser });
    } catch (err) {
      console.error('Ошибка в verifyCode:', err);
      return ctx.badRequest('Ошибка при проверке кода');
    }
  }
};