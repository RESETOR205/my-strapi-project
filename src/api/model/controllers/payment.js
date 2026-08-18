'use strict';

module.exports = {
  async createInvoice(ctx) {
    try {
      const { modelId, userEmail } = ctx.request.body;

      if (!modelId) {
        return ctx.badRequest('Не передан ID 3D-модели');
      }

      // 1. Находим 3D-модель в базе Strapi, чтобы взять реальную цену
      const model = await strapi.entityService.findOne('api::model.model', modelId);

      if (!model) {
        return ctx.notFound('3D-модель не найдена');
      }

      // 2. Создаем черновик заказа в базе данных
      const order = await strapi.entityService.create('api::order.order', {
        data: {
          model: model.id,
          amount: model.price,
          status: 'pending',
          email: userEmail || 'anonymous',
        },
      });

      // 3. Отправляем запрос к OxaPay для создания инвойса
      const oxaResponse = await fetch('https://api.oxapay.com/merchants/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: process.env.OXAPAY_MERCHANT_KEY,
          amount: model.price,
          currency: 'USD',
          lifeTime: 30, // Ссылка живет 30 минут
          feePaidByPayer: 0,
          underPaidCover: 0,
          callbackUrl: `${process.env.BACKEND_URL}/api/payments/webhook`,
          returnUrl: `${process.env.FRONTEND_URL}/success.html?orderId=${order.id}`,
          description: `Оплата 3D-модели: ${model.title}`,
          orderId: String(order.id),
        }),
      });

      const oxaData = await oxaResponse.json();

      if (oxaData.result !== 100) {
        strapi.log.error('Ошибка OxaPay:', oxaData);
        return ctx.badRequest('Не удалось сформировать счет на оплату');
      }

      // Сохраняем trackId от OxaPay в заказ
      await strapi.entityService.update('api::order.order', order.id, {
        data: { trackId: String(oxaData.trackId) },
      });

      // 4. Отдаем фронтенду ссылку на форму оплаты
      return ctx.send({
        payLink: oxaData.payLink,
        orderId: order.id,
      });
    } catch (err) {
      strapi.log.error(err);
      return ctx.internalServerError('Внутренняя ошибка сервера');
    }
  },

  async webhook(ctx) {
    try {
      const { status, orderId, trackId } = ctx.request.body;

      // OxaPay присылает status: 'Paid', когда платеж успешно подтвержден сетью
      if (status === 'Paid' && orderId) {
        const order = await strapi.entityService.findOne('api::order.order', orderId, {
          populate: ['model'],
        });

        if (order && order.status !== 'paid') {
          // Обновляем статус заказа
          await strapi.entityService.update('api::order.order', orderId, {
            data: {
              status: 'paid',
            },
          });

          strapi.log.info(`Заказ #${orderId} успешно оплачен!`);
        }
      }

      // Всегда отвечаем OxaPay статусом 200, подтверждая получение вебхука
      return ctx.send('OK');
    } catch (err) {
      strapi.log.error('Ошибка обработки вебхука:', err);
      return ctx.send('OK');
    }
  },
};