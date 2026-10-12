const paymentService = require("../services/paymentService");
const { sequelize, Order, OrderItem, Menu, Table } = require("../models"); // Pastikan import sequelize instance-nya
//create data
// Batalkan order dan kembalikan stok. Aman dipanggil berulang
// (kalau sudah canceled, tidak melakukan apa-apa).
const cancelOrderAndRestoreStock = async (orderId) => {
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

    await order.update({ status: "canceled" }, { transaction: t });
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
  const statusResponse =
    await paymentService.handleMidtransWebhook(notification);

  const {
    order_id,
    transaction_status,
    fraud_status,
  } = statusResponse;

  console.log(
    `Webhook: order_id=${order_id} status=${transaction_status}`
  );

  const order = await Order.findOne({
    where: { order_code: order_id },
  });

  if (!order) {
    throw new Error("Order tidak ditemukan");
  }

  if (
    transaction_status === "settlement" ||
    transaction_status === "capture"
  ) {
    if (fraud_status === "accept" || !fraud_status) {
      await Order.update(
        {
          payment_status: "paid",
          status: "processing",
        },
        {
          where: { order_code: order_id },
        }
      );
    }
  } else if (
    transaction_status === "cancel" ||
    transaction_status === "deny" ||
    transaction_status === "expire"
  ) {
    await Order.update(
      {
        payment_status: "failed",
        status: "canceled",
      },
      {
        where: { order_code: order_id },
      }
    );
  }

  return {
    message: "Webhook processed",
  };
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

// Order complete update
exports.completeOrder = async (id) => {
  await Order.update(
    {
      status: "completed",
    },
    {
      where: { id },
    }
  );

  return {
    message: "Order completed",
  };
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

//update status ordered
exports.updateOrderStatus = async (
  id,
  status
) => {
  const updateData = { status };

  if (status === "processing") {
    updateData.payment_status = "paid";
  }

  await Order.update(
    updateData,
    {
      where: { id },
    }
  );

  return {
    message: "Status updated",
  };
};