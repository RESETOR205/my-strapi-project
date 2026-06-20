module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          // Разрешаем загрузку картинок и 3D-файлов с твоего сервера Railway
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', '*.up.railway.app'],
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', '*.up.railway.app'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['*'], // Разрешаем любым сайтам (включая твой github.io) стучаться к бэкенду
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];