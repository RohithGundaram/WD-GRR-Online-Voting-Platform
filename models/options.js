'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Options extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Options.belongsTo(models.Questions, {
        onDelete: "CASCADE",
        foreignKey: "questionID",
      });
    }

    static async add({option, questionID}) {
      return this.create({
        option,
        questionID,
      });
    }
    static async edit({option, id}) {
      return this.update({
        option,
        where:{id},
      });
    }

    static async delete(id){
      this.destroy({
        where:{id},
      });
    }

    static optionsList(questionID){
      return this.findAll({
        where:{questionID},
        order: [["id","ASC"]],
      })
    }

    static getOption(id){
      return this.findOne({
        where:{id},
      });
    }

  }

  Options.init({
    option: {type:DataTypes.STRING, allowNull: false,},
   }, {
    sequelize,
    modelName: 'Options',
  });
  return Options;
};