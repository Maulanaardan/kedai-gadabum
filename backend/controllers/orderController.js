const { Order, OrderItem } = require("../models");

exports.create = async (req, res) => {
  try {
    const { tableNumber, items, total } = req.body;

    const order = await Order.create({
      table_id: tableNumber,
      total_price: total,
      status: "pending",
      order_code: "ORD-" + Date.now(),
    });

    await Promise.all(
      items.map((item) =>
        OrderItem.create({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.qty,
          price: item.price,
          sub_total: item.qty * item.price,
        })
      )
    );

    res.status(201).json({ message: "Order berhasil", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: "item",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};