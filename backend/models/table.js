'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Table extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
          Table.hasMany(models.Order, {
            foreignKey: "table_id",
            as: "orders",
          });
    }
  }
  Table.init({
    table_number: DataTypes.STRING,
    qrCode: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Table',
  });
  return Table;
};