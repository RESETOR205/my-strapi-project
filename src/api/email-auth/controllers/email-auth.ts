export default {
  async sendCode(ctx: any) {
    const { username, email, password } = ctx.request.body;

    // Проверка заполненности полей
    if (!username || !email || !password) {
      return ctx.badRequest('Пожалуйста, заполните все поля');
    }

    try {
      const emailLower = email.toLowerCase();
      
      // Ищем, есть ли уже такой пользователь
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: emailLower }
      });

      // Если пользователь есть
      if (existingUser) {
        if (existingUser.confirmed) {
          return ctx.badRequest('Этот Email уже зарегистрирован и подтвержден.');
        }
        // Если он есть, но не подтвержден (например, не ввел код в прошлый раз), удаляем его старую запись
        await strapi.query('plugin::users-permissions.user').delete({
          where: { id: existingUser.id }
        });
      }

      // Генерируем 6-значный код
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // ПОИСК РОЛИ: Находим ID роли 'Authenticated' в базе данных Strapi
      const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' }
      });

      if (!authenticatedRole) {
        return ctx.badRequest('Системная ошибка: роль Authenticated не найдена');
      }

      // Создаем нового неподтвержденного пользователя с кодом и ПРИВЯЗАННОЙ РОЛЬЮ
      const newUser = await strapi.plugin('users-permissions').service('user').add({
        username,
        email: emailLower,
        password,
        confirmed: false,
        provider: 'local',
        confirmationToken: verificationCode,
        role: authenticatedRole.id // <-- Автоматическая выдача прав
      });

      // Отправляем реальное письмо на почту через Google Apps Script API (ОБХОД БЛОКИРОВКИ)
      try {
        const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbwWBLhq4sxBKzMoxqh6l8PMqjonQf1_t02aGZGoyRjljP4xG4mBM_Dl81r0ugT9wVPD/exec';
        
        const response = await fetch(googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: newUser.email,
            subject: 'Код подтверждения для регистрации на 3D Маркетплейсе',
            html: `
              <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2>Добро пожаловать в 3D Market!</h2>
                <p>Ваш код для завершения регистрации:</p>
                <h1 style="color: #4CAF50; letter-spacing: 5px;">${verificationCode}</h1>
                <p>Никому не сообщайте этот код.</p>
              </div>
            `
          })
        });

        if (!response.ok) {
          throw new Error('Google Script вернул ошибку сети');
        }

        console.log(`Письмо успешно отправлено на ${emailLower}`);
      } catch (emailErr: any) {
        console.error("Ошибка при отправке письма через Google Script:", emailErr);
        // Если письмо не ушло, удаляем пользователя, чтобы он не "застрял" в базе без кода
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
      // Ищем пользователя по email и коду подтверждения
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase(), confirmationToken: code }
      });

      if (!user) {
        return ctx.badRequest('Неверный код');
      }

      // Обновляем статус: подтверждаем email и удаляем использованный код
      const updatedUser = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmed: true, confirmationToken: null }
      });

      // Выпускаем токен авторизации (JWT)
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      // Возвращаем токен и данные пользователя для входа
      return ctx.send({ jwt, user: updatedUser });
    } catch (err) {
      console.error('Ошибка в verifyCode:', err);
      return ctx.badRequest('Ошибка при проверке кода');
    }
  }
};