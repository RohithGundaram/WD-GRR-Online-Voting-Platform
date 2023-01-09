'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voters.belongsTo(models.Elections,{
        onDelete: "CASCADE",
        foreignKey: "electionID",
      });
    }

    static async add(voterID, password, electionID) {
      return this.create({
        voterID,
        password,
        electionID,
        castedVote: false,
      });
    }

    static async delete(voterID){
      return await this.destroy({
        where:{voterID},
      })
    }

    static async markAsVoted(id) {
      return await this.update({
        castedVote: true,
      },
      {where: {id,}}
      );
    }

    static async votersList(electionID) {
      return await this.findAll(
        {
          where: {electionID,},
          order: [["id", "ASC"]],
        });
    }

    static async getVoter(id) {
      return await this.findOne(
        {
          where: {id,},
        });
    }

  }
  Voters.init({
    voterId: DataTypes.STRING,
    password: DataTypes.STRING,
    castedVote: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Voters',
  });
  return Voters;
};