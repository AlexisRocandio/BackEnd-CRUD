import mysql from 'mysql2/promise';
import sequelize, { dbConfig } from '../db.js';
import usersCrud from '../models/users.js';
import { encryptPassword } from '../utils/password.js';

const seedUsers = [
  { name: 'Administrador', email: 'admin@crudspi.com', password: '12345', role: 'admin' },
  { name: 'Juan Pérez', email: 'juan@crudspi.com', password: '12345', role: 'user' },
  { name: 'María López', email: 'maria@crudspi.com', password: '12345', role: 'user' },
];

async function main() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
  });
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
  console.log(`Base de datos "${dbConfig.database}" lista`);

  await sequelize.sync();
  console.log('Tabla "userscrud" lista');

  for (const { password, ...data } of seedUsers) {
    const [, created] = await usersCrud.findOrCreate({
      where: { email: data.email },
      defaults: { ...data, password: await encryptPassword(password) },
    });
    console.log(`${created ? 'Creado ' : 'Ya existe'}: ${data.email} (${data.role})`);
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error('Error en setup de la base de datos:', error);
  process.exit(1);
});
