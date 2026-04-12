import postgres from "postgres";

const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { max: 10, idle_timeout: 30 })
  : postgres({
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      max: 10,
      idle_timeout: 30,
    });

export default sql;
