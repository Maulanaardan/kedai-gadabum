'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',   
        key: 'id'         
      },
      onUpdate: 'CASCADE', 
      onDelete: 'SET NULL' 
    },
    order_code: {
      type: Sequelize.STRING,
      unique: true
    },
    table_id: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Tables',  
        key: 'id'         
      },
    },
    status: {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'canceled'),
      defaultValue: 'pending'
    },
    total_price: {
      type: Sequelize.DECIMAL(10, 2)
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });
},

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};

