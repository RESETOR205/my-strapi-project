import path from 'path';

export default ({ env }) => {
  const databaseUrl = env('DATABASE_URL');

  // Если на Railway задана переменная DATABASE_URL, подключаемся к PostgreSQL
  if (databaseUrl) {
    // Разбираем строку подключения вручную, чтобы не устанавливать лишние плагины
    const connectionString = new URL(databaseUrl);
    
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: connectionString.hostname,
          port: connectionString.port || 5432,
          database: connectionString.pathname.substring(1),
          user: connectionString.username,
          password: connectionString.password,
          ssl: { rejectUnauthorized: false }, // Обязательно для безопасного подключения на Railway
        },
        debug: false,
      },
    };
  }

  // Если DATABASE_URL нет (локальный запуск на компьютере), используем SQLite
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };
};