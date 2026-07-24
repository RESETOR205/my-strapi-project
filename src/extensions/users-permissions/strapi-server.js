module.exports = (plugin) => {
  const defaultRegister = plugin.controllers.auth.register;

  // 1. Генерация 6-значного кода при регистрации
  plugin.controllers.auth.register = async (ctx) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    ctx.request.body.verificationCode = code;

    await defaultRegister(ctx);

    const { email } = ctx.request.body;

    try {
      await strapi.plugins['email'].services.email.send({
        to: email,
        from: 'no-reply@yourdomain.com',
        subject: 'Код подтверждения | 3D Market',
        html: `<div style="padding: 20px; font-family: sans-serif;">
                 <h2>Добро пожаловать в 3D Market!</h2>
                 <p>Ваш 6-значный код для подтверждения аккаунта:</p>
                 <h1 style="color: #4f46e5; letter-spacing: 4px;">${code}</h1>
               </div>`,
      });
    } catch (err) {
      console.error('Ошибка отправки Email:', err);
    }

    ctx.body = {
      status: 'CODE_SENT',
      message: 'Код подтверждения отправлен на вашу почту',
      email: email
    };
  };

  // 2. Контроллер проверки кода
  plugin.controllers.auth.verifyCode = async (ctx) => {
    const { email, code } = ctx.request.body;

    if (!email || !code) {
      return ctx.badRequest('Укажите email и 6-значный код');
    }

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase() }
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

  // 3. Публичный роут (auth: false)
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