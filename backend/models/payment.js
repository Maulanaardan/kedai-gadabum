'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
    }
  }

  Payment.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM('cash', 'qris', 'card'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending',
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'Payments', // biar fix sama migration
    }
  );

  return Payment;
};