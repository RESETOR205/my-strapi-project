import path from 'path';

export default ({ env }) => {
  // Если сервер запущен на Railway и видит DATABASE_URL, включаем Postgres
  if (env('DATABASE_URL')) {
    return {
      connection: {
        client: 'postgres',
        connection: {
          connectionString: env('DATABASE_URL'),
          ssl: { rejectUnauthorized: false }
        },
      },
    };
  }

  // Если запускаем локально на компьютере, работает обычный файлик SQLite
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: path.join(__dirname, '..', '..', '.tmp/data.db'),
      },
      useNullAsDefault: true,
    },
  };
};