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
      Elections.belongsTo(models.Admins, {
        onDelete: "CASCADE",
        foreignKey: "adminID",
      });
      Elections.hasMany(models.Questions, {
        onDelete: "CASCADE",
        foreignKey: "electionID",
      });
      Elections.hasMany(models.Voters, {
        onDelete: "CASCADE",
        foreignKey: "electionID",
      });
    }

    static async add({electionName, adminID}) {
      const res = await Elections.create({
        adminID: adminID,
        electionName: electionName,
        isElectionLive: false,
        ended: false,
      });
      return res;
    }

    static async live(id) {
      return this.update(
        {isElectionLive:true},
        {where: {id}}
      );
    }

    static async end(id) {
      return this.update(
        {
          ended: true,
          isElectionLive: false
        },
        {where: {id}}
      );
    }

    static async electionsList(adminID){
      return this.findAll({
        where:{adminID},
        order: [["id","ASC"]],
      });
    }

    static async getElection(id) {
      return this.findOne({
        where: {id},
      });
    }

    static async edit({id, electionName, adminID}){
      return this.update(
        {electionName},
        {where:{idm,adminID}}
      )
    }

  }

  Elections.init({
    electionName: DataTypes.STRING,
    isElectionLive: DataTypes.BOOLEAN,
    ended: DataTypes.BOOLEAN,
    }, 
    {
      sequelize,
      modelName: 'Elections',
    }
  );
  return Elections;
};