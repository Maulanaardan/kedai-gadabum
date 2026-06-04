'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'order_type', {
      type: Sequelize.ENUM('dine_in', 'take_away'),
      allowNull: true,
      defaultValue: 'dine_in',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Orders', 'order_type');
  },
};