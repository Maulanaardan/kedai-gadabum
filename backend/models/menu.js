"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        Menu.hasMany(models.OrderItem, {
          foreignKey: "menu_item_id",
          as: "orderItems"
        });
    }
  }
  Menu.init(
    {
      name: DataTypes.STRING,
      price: DataTypes.FLOAT,
      category: DataTypes.ENUM("food", "drink"),
      description: DataTypes.STRING,
      image: DataTypes.STRING,
      stock: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Menu",
    }
  );
  return Menu;
};
