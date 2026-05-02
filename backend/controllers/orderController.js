const { Order, OrderItem, Menu } = require("../models");

exports.create = async (req, res) => {
  try {
    const { tableNumber, items, total } = req.body || {};

    if (!tableNumber || !items || !Array.isArray(items)) {
      return res.status(400).json({
        error: "Data tidak lengkap (tableNumber & items wajib)",
      });
    }

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
          include: [
            {
              model: Menu,
              as: "menu",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await Order.update({ status }, { where: { id } });

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;

    await Order.update(
      { 
        payment_status: "paid",
        status: "processing" // 🔥 GANTI INI
      },
      { where: { id } }
    );

    res.json({ message: "Payment success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaidOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        payment_status: "paid",
      },
      include: [
        {
          model: OrderItem,
          as: "item",
          include: [
            {
              model: Menu,
              as: "menu",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const { id } = req.params;

    await Order.update(
      { status: "completed" },
      { where: { id } }
    );

    res.json({ message: "Order completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


