import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const usersCrud = sequelize.define('usersCrud', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'userscrud', // El nombre de la tabla que uso en mi base de datos en prod. Se creo con fines de demostracion para este crud.
  timestamps: false,
});

export default usersCrud;
