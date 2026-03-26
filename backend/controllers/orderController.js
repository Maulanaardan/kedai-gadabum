const { Order, OrderItems, Menu, Table, Payment } = require("../models");

exports.testRelasi = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItems,
          as: "items",
          include: [
            {
              model: Menu,
              as: "menu",
            },
          ],
        },
        {
          model: Table,
          as: "table",
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};