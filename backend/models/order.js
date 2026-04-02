'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.hasMany(models.OrderItem, { 
        foreignKey: 'order_id',
        as: "item", });
      Order.belongsTo(models.Table, {
        foreignKey: "table_id",
        as: "table",
      });
      Order.hasOne(models.Payment, {
        foreignKey: "order_id",
        as: "payment",
      });
    }
  }
  Order.init({
      table_id: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.ENUM('pending','processing','completed','canceled'),
      defaultValue: 'pending'
    },
    total_price: DataTypes.FLOAT,
    order_code: {
      type: DataTypes.STRING,
      unique: true
    },
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};