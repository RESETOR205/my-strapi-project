module.exports = (plugin) => {
  // 1. Кастомная регистрация: ОБНОВЛЯЕМ неподтвержденный аккаунт вместо удаления
  plugin.controllers.auth.customRegister = async (ctx) => {
    const { email, username, password } = ctx.request.body;

    if (!email || !username || !password) {
      return ctx.badRequest('Заполните все поля (email, username, password)');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Поиск существующих записей в БД
    const existingEmailUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: cleanEmail }
    });

    const existingUsernameUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username: cleanUsername }
    });

    // Если аккаунт с этим EMAIL уже ПОДТВЕРЖДЁН — блокируем
    if (existingEmailUser && existingEmailUser.confirmed) {
      return ctx.badRequest('Пользователь с таким email уже зарегистрирован');
    }

    // Если этот USERNAME принадлежит ДРУГОМУ подтвержденному пользователю — блокируем
    if (existingUsernameUser && existingUsernameUser.confirmed && existingUsernameUser.id !== existingEmailUser?.id) {
      return ctx.badRequest('Имя пользователя уже занято');
    }

    // Генерируем новый 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      if (existingEmailUser && !existingEmailUser.confirmed) {
        // --- СЦЕНАРИЙ А: Аккаунт есть, но НЕ ПОДТВЕРЖДЕН ---
        // Перезаписываем данные существующей записи (БЕЗ УДАЛЕНИЯ!)
        await strapi.plugin('users-permissions').service('user').edit(existingEmailUser.id, {
          username: cleanUsername,
          password: password, // Strapi сам захеширует новый пароль
        });

        // Сохраняем новый код
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: existingEmailUser.id },
          data: { verificationCode: code }
        });

      } else {
        // --- СЦЕНАРИЙ Б: Совершенно новый пользователь ---
        const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' }
        });

        await strapi.plugin('users-permissions').service('user').add({
          username: cleanUsername,
          email: cleanEmail,
          password: password,
          role: defaultRole ? defaultRole.id : null,
          confirmed: false,
          verificationCode: code
        });
      }
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      return ctx.badRequest(`Не удалось зарегистрировать: ${err.message}`);
    }

    // Отправка письма с новым кодом
    try {
      await strapi.plugins['email'].services.email.send({
        to: cleanEmail,
        from: 'no-reply@yourdomain.com',
        subject: 'Код подтверждения | 3D Market',
        html: `<div style="padding: 20px; font-family: sans-serif;">
                 <h2>Добро пожаловать в 3D Market!</h2>
                 <p>Ваш новый код для подтверждения аккаунта:</p>
                 <h1 style="color: #4f46e5; letter-spacing: 4px;">${code}</h1>
               </div>`,
      });
    } catch (err) {
      console.error('Ошибка отправки Email:', err);
    }

    return ctx.send({
      status: 'CODE_SENT',
      message: 'Код подтверждения отправлен на вашу почту',
      email: cleanEmail
    });
  };

  // 2. Контроллер проверки кода
  plugin.controllers.auth.verifyCode = async (ctx) => {
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

    // Подтверждаем аккаунт
    const updatedUser = await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: {
        confirmed: true,
        verificationCode: null
      }
    });

    // Выдаем авторизационный JWT токен
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
  };

  // 3. Открытые маршруты
  plugin.routes['content-api'].routes.push(
    {
      method: 'POST',
      path: '/auth/custom-register',
      handler: 'auth.customRegister',
      config: {
        auth: false,
        prefix: '',
      },
    },
    {
      method: 'POST',
      path: '/auth/verify-code',
      handler: 'auth.verifyCode',
      config: {
        auth: false,
        prefix: '',
      },
    }
  );

  return plugin;
};