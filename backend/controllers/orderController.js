const { Order, Table, OrderItem, Menu } = require("../models");
const midtransClient = require("midtrans-client");

// 🔥 Setup Midtrans Core API (Sandbox)
const core = new midtransClient.CoreApi({
  isProduction: false, // sandbox
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// 🔥 CREATE ORDER
exports.create = async (req, res) => {
  try {
    const { tableNumber, item, payment_method } = req.body;

    if (!tableNumber || !item || !Array.isArray(item)) {
      return res.status(400).json({
        error: "Data tidak lengkap (tableNumber & item wajib)",
      });
    }

    const orderCode = "ORD-" + Date.now();

    // buat order dulu (total sementara 0)
    const order = await Order.create({
      table_id: tableNumber,
      total_price: 0,
      status: "pending",
      payment_status: "unpaid",
      order_code: orderCode,
    });

    let total = 0;

    for (const i of item) {
      const menu = await Menu.findByPk(i.menu_id);
      if (!menu) continue;

      const sub_total = menu.price * i.quantity;
      total += sub_total;

      await OrderItem.create({
        order_id: order.id,
        menu_item_id: i.menu_id,
        quantity: i.quantity,
        price: menu.price,
        sub_total: sub_total,
      });
    }

    await Order.update({ total_price: total }, { where: { id: order.id } });

    // 🔥 Kalau QRIS → minta QR ke Midtrans
    if (payment_method === "qris") {
      const chargeResponse = await core.charge({
        payment_type: "qris",
        transaction_details: {
          order_id: orderCode,         // pakai order_code sebagai ID unik
          gross_amount: total,
        },
        qris: {
          acquirer: "gopay",           // acquirer sandbox
        },
      });

      // Ambil URL QR dari response Midtrans
      const qrAction = chargeResponse.actions?.find(
        (a) => a.name === "generate-qr-code"
      );
      const qr_url = qrAction?.url ?? null;
      const payment_token = chargeResponse.transaction_id ?? null;

      // Simpan qr_url & token ke order
      await Order.update(
        { qr_url, payment_token },
        { where: { id: order.id } }
      );

      // Reload order terbaru
      const updatedOrder = await Order.findByPk(order.id);

      return res.status(201).json({
        message: "Order berhasil",
        order: updatedOrder,
        qr_url,
      });
    }

    // Non-QRIS: kembalikan biasa
    res.status(201).json({
      message: "Order berhasil",
      order,
    });
  } catch (err) {
    console.error("🔥 ERROR CREATE ORDER:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 WEBHOOK dari Midtrans (otomatis dipanggil saat user sudah bayar)
exports.midtransWebhook = async (req, res) => {
  try {
    const notification = req.body;

    // Verifikasi notifikasi dari Midtrans
    const statusResponse = await core.transaction.notification(notification);

    const { order_id, transaction_status, fraud_status } = statusResponse;

    console.log(`Webhook: order_id=${order_id} status=${transaction_status}`);

    // Cari order berdasarkan order_code
    const order = await Order.findOne({ where: { order_code: order_id } });
    if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });

    // Update status berdasarkan notifikasi Midtrans
    if (transaction_status === "settlement" || transaction_status === "capture") {
      if (fraud_status === "accept" || !fraud_status) {
        await Order.update(
          { payment_status: "paid", status: "processing" },
          { where: { order_code: order_id } }
        );
      }
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      await Order.update(
        { payment_status: "failed", status: "canceled" },
        { where: { order_code: order_id } }
      );
    }

    res.status(200).json({ message: "OK" });
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
exports.getAll = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Menu, as: "menu" }],
        },
        { model: Table, as: "table" },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 KHUSUS CASHIER
exports.getCashierOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Menu, as: "menu" }],
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
      where: { payment_status: "paid" },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Menu, as: "menu" }],
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