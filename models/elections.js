'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Elections.init({
    electionName: DataTypes.STRING,
    isElectionLive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Elections',
  });
  return Elections;
};