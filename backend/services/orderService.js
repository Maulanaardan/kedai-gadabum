const paymentService = require("../services/paymentService");
const { sequelize, Order, OrderItem, Menu, Table } = require("../models"); // Pastikan import sequelize instance-nya
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};
//create data
// Batalkan order dan kembalikan stok. Aman dipanggil berulang
// (kalau sudah canceled, tidak melakukan apa-apa).
const cancelOrderAndRestoreStock = async (orderId, paymentStatus) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order || order.status === "canceled") {
      await t.commit();
      return;
    }

    const items = await OrderItem.findAll({
      where: { order_id: order.id },
      order: [["menu_item_id", "ASC"]],
      transaction: t,
    });

    for (const it of items) {
      await Menu.increment("stock", {
        by: it.quantity,
        where: { id: it.menu_item_id },
        transaction: t,
      });
    }

    const changes = { status: "canceled" };
    if (paymentStatus) changes.payment_status = paymentStatus;
    await order.update(changes, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
exports.cancelOrderAndRestoreStock = cancelOrderAndRestoreStock;

//create data
exports.createOrder = async (data) => {
  const { tableNumber, item, payment_method, order_type } = data;

  if (!tableNumber || !item || !Array.isArray(item)) {
    throw badRequest("Data tidak lengkap");
  }
  if (item.length === 0) {
    throw badRequest("Keranjang kosong");
  }
  for (const i of item) {
    if (!Number.isInteger(i.menu_id) || i.menu_id <= 0) {
      throw badRequest("menu_id tidak valid");
    }
    if (!Number.isInteger(i.quantity) || i.quantity <= 0) {
      throw badRequest("Jumlah harus bilangan bulat lebih dari 0");
    }
  }

  const orderCode = "ORD-" + Date.now();
  let order;
  let total = 0;

  // TAHAP 1: buat order + kurangi stok (transaksi singkat, tanpa API eksternal)
  const t = await sequelize.transaction();
  try {
    order = await Order.create(
      {
        table_id: tableNumber,
        total_price: 0,
        status: "pending",
        payment_status: "unpaid",
        order_code: orderCode,
        order_type: order_type ?? "dine_in",
      },
      { transaction: t }
    );

    // Urutkan supaya urutan lock selalu sama -> mencegah deadlock
    const sorted = [...item].sort((a, b) => a.menu_id - b.menu_id);

    for (const i of sorted) {
      const menu = await Menu.findByPk(i.menu_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!menu) {
        throw badRequest(`Menu dengan ID ${i.menu_id} tidak ditemukan`);
      }
      if (menu.stock < i.quantity) {
        throw badRequest(`Stock ${menu.name} habis (sisa: ${menu.stock})`);
      }

      const sub_total = menu.price * i.quantity;
      total += sub_total;

      await OrderItem.create(
        {
          order_id: order.id,
          menu_item_id: i.menu_id,
          quantity: i.quantity,
          price: menu.price,
          sub_total,
        },
        { transaction: t }
      );

      menu.stock -= i.quantity;
      await menu.save({ transaction: t });
    }

    await order.update({ total_price: total }, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // TAHAP 2: pembayaran QRIS, di luar transaksi
  if (payment_method === "qris") {
    try {
      const payment = await paymentService.createQrisPayment({
        orderCode,
        total,
      });
      return { message: "Order berhasil", order, qr_url: payment.qr_url };
    } catch (err) {
      // Charge gagal: batalkan order dan balikin stok
      await cancelOrderAndRestoreStock(order.id).catch((e) =>
        console.error("Gagal rollback order", order.id, e)
      );
      throw err;
    }
  }

  return { message: "Order berhasil", order };
};

//Webhook
exports.midtransWebhook = async (notification) => {
  // Status diambil dari API Midtrans (terverifikasi), bukan dipercaya dari body request
  const statusResponse =
    await paymentService.handleMidtransWebhook(notification);

  const { order_id, transaction_status, fraud_status } = statusResponse;

  console.log(`Webhook: order_id=${order_id} status=${transaction_status}`);

  const order = await Order.findOne({ where: { order_code: order_id } });

  if (!order) {
    const err = new Error("Order tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const isSuccess =
    (transaction_status === "settlement" || transaction_status === "capture") &&
    (fraud_status === "accept" || !fraud_status);

  const isFailed = ["cancel", "deny", "expire"].includes(transaction_status);

  if (isSuccess) {
    // Idempotent: abaikan notifikasi duplikat, dan jangan menghidupkan order yang sudah dibatalkan
    if (order.payment_status !== "paid" && order.status !== "canceled") {
      await order.update({ payment_status: "paid", status: "processing" });
    }
  } else if (isFailed) {
    // Jangan batalkan order yang sudah dibayar; helper sudah aman dipanggil berulang
    if (order.payment_status !== "paid") {
      await cancelOrderAndRestoreStock(order.id, "failed");
    }
  }

  return { message: "Webhook processed" };
};

//get all
exports.getAllOrders = async () => {
  return await Order.findAll({
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Menu, as: "menu" }],
      },
      {
        model: Table,
        as: "table",
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// CASHIER
exports.getCashierOrders = async () => {
  return await Order.findAll({
    attributes: [
      "id",
      "order_code",
      "table_id",
      "status",
      "total_price",
      "order_type",      // ← tambah ini
      "payment_status",
      "createdAt",
    ],
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Menu, as: "menu" }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// KITCHEN
exports.getPaidOrders = async () => {
  return await Order.findAll({
    where: {
      payment_status: "paid",
    },
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Menu, as: "menu" }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// Order update payment
exports.markOrderPaid = async (id) => {
  return await exports.updateOrderStatus(id, "processing");
};

// Check status payment
exports.getPaymentStatus = async (id) => {
  const order = await Order.findByPk(id);

  if (!order)
    throw new Error("Order tidak ditemukan");

  return {
    payment_status: order.payment_status,
    status: order.status,
  };
};

// Order complete update
exports.completeOrder = async (id) => {
  return exports.updateOrderStatus(id, "completed");
};

const ALLOWED_TRANSITIONS = {
  pending: ["processing", "canceled"],
  processing: ["completed", "canceled"],
  completed: [],
  canceled: [],
};

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

//update status ordered
// roles: peran pemanggil. Kosong (undefined) = pemanggilan internal.
exports.updateOrderStatus = async (id, status, roles) => {
  if (!Object.keys(ALLOWED_TRANSITIONS).includes(status)) {
    throw badRequest("Status tidak valid");
  }

  // Dapur hanya boleh menandai order selesai
  if (roles && !roles.includes("cashier") && status !== "completed") {
    throw httpError(403, "Tidak diizinkan mengubah ke status ini");
  }

  const order = await Order.findByPk(id);
  if (!order) {
    throw httpError(404, "Order tidak ditemukan");
  }

  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    throw httpError(
      409,
      `Tidak bisa mengubah status dari ${order.status} ke ${status}`
    );
  }

  // Batal: kembalikan stok sekalian
  if (status === "canceled") {
    await cancelOrderAndRestoreStock(order.id);
    return { message: "Status updated" };
  }

  const changes = { status };
  if (status === "processing") changes.payment_status = "paid";

  // Hanya berhasil kalau status belum berubah sejak dibaca (mencegah balapan)
  const [affected] = await Order.update(changes, {
    where: { id: order.id, status: order.status },
  });
  if (affected === 0) {
    throw httpError(409, "Status order sudah berubah, muat ulang");
  }

  return { message: "Status updated" };
};