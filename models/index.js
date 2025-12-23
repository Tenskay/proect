const { Sequelize } = require('sequelize');
const User = require('./User');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const UserModel = User(sequelize);

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
  }
};

module.exports = {
  sequelize,
  User: UserModel,
  initDatabase
};
