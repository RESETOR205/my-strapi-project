module.exports = (plugin) => {
  // 1. Контроллер для генерации кода и регистрации
  plugin.controllers.auth.customRegister = async (ctx) => {
    const { username, email, password } = ctx.request.body;

    if (!username || !email || !password) {
      return ctx.badRequest('Пожалуйста, заполните все поля');
    }

    try {
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() }
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

      const newUser = await strapi.plugins['users-permissions'].services.user.add({
        username,
        email: email.toLowerCase(),
        password,
        confirmed: false,
        provider: 'local',
        confirmationToken: verificationCode
      });

      try {
        await strapi.plugins['email'].services.email.send({
          to: newUser.email,
          from: 'noreply@yourdomain.com', 
          subject: 'Код подтверждения 3D Market',
          text: `Ваш код подтверждения: ${verificationCode}`,
          html: `<h3>Добро пожаловать в 3D Market!</h3><p>Ваш код: <strong>${verificationCode}</strong></p>`,
        });
      } catch (emailErr) {
        console.log("Письмо не отправлено:", emailErr.message);
      }

      return ctx.send({ message: 'Код успешно сгенерирован и отправлен', ok: true });
    } catch (err) {
      console.error('Ошибка в customRegister:', err);
      return ctx.badRequest('Произошла внутренняя ошибка при регистрации');
    }
  };

  // 2. Контроллер для проверки кода
  plugin.controllers.auth.verifyCode = async (ctx) => {
    const { email, code } = ctx.request.body;

    if (!email || !code) {
      return ctx.badRequest('Email и код обязательны');
    }

    try {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase(), confirmationToken: code }
      });

      if (!user) {
        return ctx.badRequest('Неверный код или срок его действия истек');
      }

      const updatedUser = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmed: true, confirmationToken: null }
      });

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

      return ctx.send({
        jwt,
        user: updatedUser
      });
    } catch (err) {
      console.error('Ошибка в verifyCode:', err);
      return ctx.badRequest('Ошибка при проверке кода');
    }
  };

  // 3. ДОБАВЛЕНИЕ МАРШРУТОВ (С УНИКАЛЬНЫМИ ПУТЯМИ)
  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/custom-auth/register', // <-- Полностью ушли от стандартного /auth/
    handler: 'auth.customRegister',
    config: { prefix: '', auth: false }
  });

  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/custom-auth/verify-code', // <-- Полностью ушли от стандартного /auth/
    handler: 'auth.verifyCode',
    config: { prefix: '', auth: false }
  });

  return plugin;
};