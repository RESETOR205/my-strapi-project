module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          // Разрешаем загрузку картинок и медиа с твоего сервера Railway
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
      origin: ['http://localhost:5500', '[http://127.0.0.1:5500](http://127.0.0.1:5500)', '[https://resetor205.github.io](https://resetor205.github.io)'],
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