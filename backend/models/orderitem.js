'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {

      OrderItem.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });

      OrderItem.belongsTo(models.Menu, {
        foreignKey: 'menu_item_id',
        as: 'menu'
      });

    }
  }

  OrderItem.init({
    order_id: DataTypes.INTEGER,
    menu_item_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    price: DataTypes.FLOAT,
    sub_total: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'orderitem'
  });

  return OrderItem;
};