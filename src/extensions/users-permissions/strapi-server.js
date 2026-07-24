module.exports = (plugin) => {
  // 1. Кастомная регистрация с полной очисткой неподтвержденных аккаунтов
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

    // Если аккаунт есть И он уже ПОДТВЕРЖДЁН — блокируем
    if (
      (existingEmailUser && existingEmailUser.confirmed) ||
      (existingUsernameUser && existingUsernameUser.confirmed)
    ) {
      return ctx.badRequest('Пользователь с таким email или именем уже зарегистрирован');
    }

    // Если аккаунт есть, но НЕ ПОДТВЕРЖДЁН — удаляем из базы без лишних вопросов
    if (existingEmailUser && !existingEmailUser.confirmed) {
      await strapi.query('plugin::users-permissions.user').delete({
        where: { id: existingEmailUser.id }
      });
    }

    if (
      existingUsernameUser &&
      !existingUsernameUser.confirmed &&
      existingUsernameUser.id !== existingEmailUser?.id
    ) {
      await strapi.query('plugin::users-permissions.user').delete({
        where: { id: existingUsernameUser.id }
      });
    }

    // Генерация нового 6-значного кода
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Получаем роль по умолчанию (Authenticated)
    const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });

    // Создаем свежую запись пользователя
    try {
      await strapi.plugin('users-permissions').service('user').add({
        username: cleanUsername,
        email: cleanEmail,
        password: password,
        role: defaultRole ? defaultRole.id : null,
        confirmed: false,
        verificationCode: code
      });
    } catch (err) {
      return ctx.badRequest(`Ошибка создания пользователя: ${err.message}`);
    }

    // Отправляем письмо с кодом
    try {
      await strapi.plugins['email'].services.email.send({
        to: cleanEmail,
        from: 'no-reply@yourdomain.com',
        subject: 'Код подтверждения | 3D Market',
        html: `<div style="padding: 20px; font-family: sans-serif;">
                 <h2>Добро пожаловать в 3D Market!</h2>
                 <p>Ваш код для подтверждения аккаунта:</p>
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

    // Подтверждаем пользователя
    const updatedUser = await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: {
        confirmed: true,
        verificationCode: null
      }
    });

    // Выпускаем токен авторизации
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

  // 3. Открываем маршруты для фронтенда
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