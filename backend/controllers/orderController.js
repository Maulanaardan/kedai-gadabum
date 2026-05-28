const { Order, Table, OrderItem, Menu } = require("../models");
const orderService = require("../services/orderService");

// 🔥 CREATE ORDER
exports.create = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("🔥 ERROR CREATE ORDER:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 WEBHOOK dari Midtrans (otomatis dipanggil saat user sudah bayar)
exports.midtransWebhook = async (req, res) => {
  try {
    const result = await orderService.midtransWebhook(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 CEK STATUS PEMBAYARAN (polling dari frontend)
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });

    res.json({ payment_status: order.payment_status, status: order.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET ALL (ADMIN / GLOBAL)
// 🔥 GET ALL (ADMIN / GLOBAL)
exports.getAll = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(); // ✅ ganti dari getAll
    res.status(200).json(result);                     // ✅ ganti dari 201
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 KHUSUS CASHIER
exports.getCashierOrders = async (req, res) => {
  try {
    const result = await orderService.getCashierOrders(); // ✅ ganti
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET PAID (KITCHEN)
exports.getPaidOrders = async (req, res) => {
  try {
    const result = await orderService.getPaidOrders(); // ✅ ganti
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 UPDATE STATUS (kitchen)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = { status };
    if (status === "processing") {
      updateData.payment_status = "paid";
    }

    await Order.update(updateData, { where: { id } });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 UPDATE PAYMENT (cashier manual)
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    await Order.update(
      { payment_status: "paid", status: "processing" },
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
    await Order.update({ status: "completed" }, { where: { id } });
    res.json({ message: "Order completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};