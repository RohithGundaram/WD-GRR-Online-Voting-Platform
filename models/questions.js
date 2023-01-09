'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Questions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Questions.belongsTo(models.Elections,{
        onDelete: "CASCADE",
        foreignKey: "electionID",
      });
      Questions.hasMany(models.Options,{
        onDelete: "CASCADE",
        foreignKey: "questionID",
      });
    }

    static async add({questionName, description, electionID}) {
      return this.create({
        questionName,
        description,
        electionID,
      });
    }

    static async edit({questionName, description, id}) {
      return this.update(
        {
          questionName,
          description,
        },
        {where: {id}}
      );
    }

    static async delete(id){
      this.destroy({where:id})
    }

  }
  Questions.init({
    questionName: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Questions',
  });
  return Questions;
};