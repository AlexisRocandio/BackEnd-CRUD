import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const PUERTO_POR_SISTEMA = {
  darwin: 8889,
  linux: 3306,
};

export const sistema = process.platform === 'darwin' ? 'macOS' : process.platform;

export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || PUERTO_POR_SISTEMA[process.platform] || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
