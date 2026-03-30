const { Order, OrderItem } = require("../models");

exports.create = async (req, res) => {
  try {
    console.log(req.body);

    const { tableNumber, items, total } = req.body;

    const order = await Order.create({
      table_id: tableNumber,      
      total_price: total,         
      status: "pending",
      order_code: "ORD-" + Date.now()
    });

    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.qty,
        price: item.price,
      });
    }

    res.status(201).json({ message: "Order berhasil", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};