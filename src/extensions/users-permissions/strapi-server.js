module.exports = (plugin) => {
  const defaultRegister = plugin.controllers.auth.register;

  // 1. Модифицированная регистрация
  plugin.controllers.auth.register = async (ctx) => {
    const { email, username } = ctx.request.body;

    if (!email || !username) {
      return ctx.badRequest('Укажите email и имя пользователя');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Ищем, есть ли уже такой пользователь в базе
    const existingUserByEmail = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: cleanEmail }
    });

    const existingUserByUsername = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username: cleanUsername }
    });

    // Если пользователь есть И он ПОДТВЕРЖДЁН (confirmed: true) -> Ошибка
    if (
      (existingUserByEmail && existingUserByEmail.confirmed) ||
      (existingUserByUsername && existingUserByUsername.confirmed)
    ) {
      return ctx.badRequest('Пользователь с таким email или именем уже зарегистрирован');
    }

    // Если аккаунт есть, но НЕ ПОДТВЕРЖДЁН -> Удаляем старую незавершенную запись
    if (existingUserByEmail && !existingUserByEmail.confirmed) {
      await strapi.query('plugin::users-permissions.user').delete({
        where: { id: existingUserByEmail.id }
      });
    }

    if (
      existingUserByUsername &&
      !existingUserByUsername.confirmed &&
      existingUserByUsername.id !== existingUserByEmail?.id
    ) {
      await strapi.query('plugin::users-permissions.user').delete({
        where: { id: existingUserByUsername.id }
      });
    }

    // Генерируем новый 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    ctx.request.body.verificationCode = code;
    ctx.request.body.email = cleanEmail;

    // Вызываем стандартную регистрацию Strapi (создаем свежую запись)
    await defaultRegister(ctx);

    // Отправляем письмо с новым кодом
    try {
      await strapi.plugins['email'].services.email.send({
        to: cleanEmail,
        from: 'no-reply@yourdomain.com',
        subject: 'Код подтверждения | 3D Market',
        html: `<div style="padding: 20px; font-family: sans-serif;">
                 <h2>Добро пожаловать в 3D Market!</h2>
                 <p>Ваш новый 6-значный код для подтверждения аккаунта:</p>
                 <h1 style="color: #4f46e5; letter-spacing: 4px;">${code}</h1>
               </div>`,
      });
    } catch (err) {
      console.error('Ошибка отправки Email:', err);
    }

    ctx.body = {
      status: 'CODE_SENT',
      message: 'Код подтверждения отправлен на вашу почту',
      email: cleanEmail
    };
  };

  // 2. Контроллер проверки кода
  plugin.controllers.auth.verifyCode = async (ctx) => {
    const { email, code } = ctx.request.body;

    if (!email || !code) {
      return ctx.badRequest('Укажите email и 6-значный код');
    }

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return ctx.badRequest('Пользователь с таким email не найден');
    }

    if (user.verificationCode !== code) {
      return ctx.badRequest('Неверный код подтверждения!');
    }

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
  };

  // 3. Открытый маршрут
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/verify-code',
    handler: 'auth.verifyCode',
    config: {
      auth: false,
      prefix: '',
    },
  });

  return plugin;
};