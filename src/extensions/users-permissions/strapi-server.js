'use strict';

module.exports = (plugin) => {
  // 1. Контроллер для генерации и отправки кода
  plugin.controllers.auth.sendCode = async (ctx) => {
    const { username, email, password } = ctx.request.body;

    if (!username || !email || !password) {
      return ctx.badRequest('Пожалуйста, заполните все поля');
    }

    try {
      const emailLower = email.toLowerCase();
      // Ищем, есть ли уже такой юзер
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: emailLower }
      });

      if (existingUser) {
        if (existingUser.confirmed) {
          return ctx.badRequest('Этот Email уже зарегистрирован и подтвержден.');
        }
        // Если не подтвержден - удаляем старую запись
        await strapi.query('plugin::users-permissions.user').delete({
          where: { id: existingUser.id }
        });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Создаем пользователя
      const newUser = await strapi.plugin('users-permissions').service('user').add({
        username,
        email: emailLower,
        password,
        confirmed: false,
        provider: 'local',
        confirmationToken: verificationCode
      });

      // Отправляем письмо
      try {
        await strapi.plugin('email').service('email').send({
          to: newUser.email,
          from: 'noreply@yourdomain.com', 
          subject: 'Код подтверждения 3D Market',
          text: `Ваш код подтверждения: ${verificationCode}`,
          html: `<h3>Добро пожаловать в 3D Market!</h3><p>Ваш код: <strong>${verificationCode}</strong></p>`,
        });
      } catch (emailErr) {
        console.log("Письмо не отправлено:", emailErr.message);
      }

      return ctx.send({ message: 'Код успешно сгенерирован', ok: true });
    } catch (err) {
      console.error('Ошибка в sendCode:', err);
      return ctx.badRequest('Произошла внутренняя ошибка');
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
        return ctx.badRequest('Неверный код');
      }

      // Обновляем статус юзера
      const updatedUser = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmed: true, confirmationToken: null }
      });

      // Выдаем токен
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return ctx.send({ jwt, user: updatedUser });
    } catch (err) {
      console.error('Ошибка в verifyCode:', err);
      return ctx.badRequest('Ошибка при проверке кода');
    }
  };

  // 3. Внедряем маршруты напрямую в системный плагин (С ЖЕСТКИМ ОТКЛЮЧЕНИЕМ АВТОРИЗАЦИИ)
  plugin.routes['content-api'].routes.push(
    {
      method: 'POST',
      path: '/auth/send-code',
      handler: 'auth.sendCode',
      config: { auth: false, prefix: '' } // <-- ВОТ ЭТО ОТКЛЮЧАЕТ НУЖДУ В ГАЛОЧКАХ
    },
    {
      method: 'POST',
      path: '/auth/verify-code',
      handler: 'auth.verifyCode',
      config: { auth: false, prefix: '' } // <-- И ЗДЕСЬ
    }
  );

  return plugin;
};