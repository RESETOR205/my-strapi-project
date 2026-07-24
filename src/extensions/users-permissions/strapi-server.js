module.exports = (plugin) => {
  // 1. Кастомная регистрация
  plugin.controllers.auth.customRegister = async (ctx) => {
    try {
      const { email, username, password } = ctx.request.body;

      if (!email || !username || !password) {
        return ctx.badRequest('Заполните все поля (email, username, password)');
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanUsername = username.trim();

      // Проверяем существующего пользователя по EMAIL
      const existingEmailUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: cleanEmail }
      });

      if (existingEmailUser) {
        if (existingEmailUser.confirmed) {
          return ctx.badRequest('Пользователь с таким email уже зарегистрирован');
        }
        // Если не подтвержден — удаляем старую запись
        await strapi.query('plugin::users-permissions.user').delete({
          where: { id: existingEmailUser.id }
        });
      }

      // Проверяем существующего пользователя по USERNAME
      const existingNameUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { username: cleanUsername }
      });

      if (existingNameUser) {
        if (existingNameUser.confirmed) {
          return ctx.badRequest('Имя пользователя уже занято');
        }
        await strapi.query('plugin::users-permissions.user').delete({
          where: { id: existingNameUser.id }
        });
      }

      // Генерируем 6-значный код
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' }
      });

      // Создаем нового пользователя
      await strapi.plugin('users-permissions').service('user').add({
        username: cleanUsername,
        email: cleanEmail,
        password: password,
        provider: 'local',
        role: defaultRole ? defaultRole.id : null,
        confirmed: false,
        verificationCode: code
      });

      // Отправляем письмо с кодом
      try {
        await strapi.plugins['email'].services.email.send({
          to: cleanEmail,
          from: 'no-reply@yourdomain.com',
          subject: 'Код подтверждения | 3D Market',
          html: `<div style="padding: 20px; font-family: sans-serif;">
                   <h2>Добро пожаловать в 3D Market!</h2>
                   <p>Ваш код подтверждения:</p>
                   <h1 style="color: #4f46e5; letter-spacing: 4px;">${code}</h1>
                 </div>`,
        });
      } catch (emailErr) {
        console.error('Ошибка отправки Email:', emailErr);
      }

      return ctx.send({
        status: 'CODE_SENT',
        message: 'Код подтверждения отправлен на вашу почту',
        email: cleanEmail
      });

    } catch (err) {
      console.error('КРИТИЧЕСКАЯ ОШИБКА РЕГИСТРАЦИИ:', err);
      return ctx.badRequest(`Не удалось зарегистрировать: ${err.message}`);
    }
  };

  // 2. Проверка 6-значного кода
  plugin.controllers.auth.verifyCode = async (ctx) => {
    try {
      const { email, code } = ctx.request.body;

      if (!email || !code) {
        return ctx.badRequest('Укажите email и 6-значный код');
      }

      const cleanEmail = email.toLowerCase().trim();

      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: cleanEmail }
      });

      if (!user) {
        return ctx.badRequest('Пользователь с таким email не найден');
      }

      if (user.verificationCode !== code) {
        return ctx.badRequest('Неверный код подтверждения!');
      }

      // Подтверждаем пользователя
      const updatedUser = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          confirmed: true,
          verificationCode: null
        }
      });

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: updatedUser.id,
      });

      return ctx.send({
        jwt,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email
        }
      });
    } catch (err) {
      return ctx.badRequest(`Ошибка верификации: ${err.message}`);
    }
  };

  // 3. Открытые маршруты
  plugin.routes['content-api'].routes.push(
    {
      method: 'POST',
      path: '/auth/custom-register',
      handler: 'auth.customRegister',
      config: { auth: false, prefix: '' },
    },
    {
      method: 'POST',
      path: '/auth/verify-code',
      handler: 'auth.verifyCode',
      config: { auth: false, prefix: '' },
    }
  );

  return plugin;
};