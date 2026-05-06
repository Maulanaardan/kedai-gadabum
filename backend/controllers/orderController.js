const { Order, Table, OrderItem, Menu } = require("../models");

// 🔥 CREATE ORDER (FIXED)
exports.create = async (req, res) => {
  try {
    const { tableNumber, item } = req.body;

    if (!tableNumber || !item || !Array.isArray(item)) {
      return res.status(400).json({
        error: "Data tidak lengkap (tableNumber & item wajib)",
      });
    }

    // 🔥 buat order dulu (total sementara 0)
    const order = await Order.create({
      table_id: tableNumber,
      total_price: 0,
      status: "pending",
      payment_status: "unpaid",
      order_code: "ORD-" + Date.now(),
    });

    let total = 0;

    // 🔥 loop item
    for (const i of item) {
      const menu = await Menu.findByPk(i.menu_id);

      if (!menu) continue;

      const sub_total = menu.price * i.quantity;
      total += sub_total;

      await OrderItem.create({
        order_id: order.id,
        menu_item_id: i.menu_id,
        quantity: i.quantity,
        price: menu.price, // ✅ dari DB
        sub_total: sub_total,
      });
    }

    // 🔥 update total setelah semua item
    await Order.update(
      { total_price: total },
      { where: { id: order.id } }
    );

    res.status(201).json({
      message: "Order berhasil",
      order,
    });
  } catch (err) {
    console.error("🔥 ERROR CREATE ORDER:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET ALL (ADMIN / GLOBAL)
exports.getAll = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
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
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 KHUSUS CASHIER (UNPAID)
exports.getCashierOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Menu,
              as: "menu", // 🔥 ini yang kurang
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET PAID (KITCHEN)
exports.getPaidOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        payment_status: "paid",
      },
      include: [
        {
          model: OrderItem,
          as: "items",
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

// 🔥 UPDATE STATUS (kitchen)
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

// 🔥 UPDATE PAYMENT (cashier)
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;

    await Order.update(
      {
        payment_status: "paid",
        status: "processing", // 🔥 masuk dapur
      },
      { where: { id } }
    );

    res.json({ message: "Payment success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 COMPLETE ORDER (kitchen selesai)
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