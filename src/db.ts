import postgres from "postgres";

const sql = postgres({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  max: 10,
  idle_timeout: 30,
});

export default sql;
