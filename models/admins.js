'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Admins extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Admins.hasMany(models.Elections, {
        onDelete: "CASCADE",
        foreignKey: "adminID",
      });
    }

    static createAdmin({adminName, email, password}) {
      return this.create({
        adminName,
        email,
        password,
      });
    }
  }
  Admins.init({
    adminName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Admins',
  });
  return Admins;
};