const Sequelize = require('sequelize')
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.SQLITE_STORAGE ?? './db-dev.sqlite',
  logging: console.log
});

const User = sequelize.define('user', {
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
  },
  name: {
    type: Sequelize.STRING
  }
})

const Board = sequelize.define('board', {
  title: {
    type: Sequelize.STRING
  },
  bgColor: {
    type: Sequelize.STRING,
    defaultValue: 'rgb(0, 121, 191)'
  }
})
Board.belongsTo(User)

const List = sequelize.define('list', {
  title: {
    type: Sequelize.STRING
  },
  pos: {
    type: Sequelize.DOUBLE,
    defaultValue: 65535
  }
})
Board.hasMany(List)

const Card = sequelize.define('card', {
  title: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  pos: {
    type: Sequelize.DOUBLE,
    defaultValue: 65535
  }
})
List.hasMany(Card)

module.exports = { 
  sequelize, 
  User,
  Board,
  List,
  Card
}
