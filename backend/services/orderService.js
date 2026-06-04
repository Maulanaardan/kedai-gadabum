const paymentService = require("../services/paymentService");
//create data
const { sequelize, Order, OrderItem, Menu } = require("../models"); // Pastikan import sequelize instance-nya

exports.createOrder = async (data) => {
  const { tableNumber, item, payment_method, order_type } = data;

  if (!tableNumber || !item || !Array.isArray(item)) {
    throw new Error("Data tidak lengkap");
  }

  const orderCode = "ORD-" + Date.now();

  // 🔥 1. MULAI TRANSAKSI DATABASE
  const t = await sequelize.transaction();

  try {
    // Buat order utama di dalam transaksi
    const order = await Order.create({
      table_id: tableNumber,
      total_price: 0,
      status: "pending",
      payment_status: "unpaid",
      order_code: orderCode,
      order_type: order_type ?? "dine_in",
    }, { transaction: t }); // 👈 ikutsertakan transaksi

    let total = 0;

    for (const i of item) {
      // 🔥 2. LOCK MENU BIAR TIDAK TERJADI RACE CONDITION
      const menu = await Menu.findByPk(i.menu_id, {
        transaction: t,
        lock: t.LOCK.UPDATE // Pembeli lain harus antre nunggu baris ini selesai di-update
      });

      if (!menu) {
        throw new Error(`Menu dengan ID ${i.menu_id} tidak ditemukan`);
      }

      // Cek stok cukup
      if (menu.stock < i.quantity) {
        throw new Error(`Stock ${menu.name} habis (sisa: ${menu.stock})`);
      }

      const sub_total = menu.price * i.quantity;
      total += sub_total;

      // Buat OrderItem
      await OrderItem.create({
        order_id: order.id,
        menu_item_id: i.menu_id,
        quantity: i.quantity,
        price: menu.price,
        sub_total,
      }, { transaction: t });

      // Kurangi stock langsung lewat instance biar aman
      menu.stock -= i.quantity;
      await menu.save({ transaction: t });
    }

    // Update total harga orderan
    await order.update({ total_price: total }, { transaction: t });

    // Kalau pembayarannya QRIS
    if (payment_method === "qris") {
      const payment = await paymentService.createQrisPayment({
        orderCode,
        total,
      });

      await order.update({
        qr_url: payment.qr_url,
        payment_token: payment.payment_token,
      }, { transaction: t });

      // 🔥 3. COMMIT TRANSAKSI JIKA SEMUA SUKSES
      await t.commit();

      return {
        message: "Order berhasil",
        order: order, // Tidak perlu findByPk lagi karena objek 'order' sudah ter-update otomatis di memori
        qr_url: payment.qr_url,
      };
    }

    // 🔥 COMMIT UNTUK NON-QRIS (CASH/MANUAL)
    await t.commit();

    return {
      message: "Order berhasil",
      order,
    };

  } catch (error) {
    // 🔥 4. JIKA ADA SATU SAJA YANG ERROR, BATALKAN SEMUA PROSES DI ATAS
    await t.rollback();
    throw error; // Lempar error ke controller agar ditangkap try-catch milik controller
  }
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

  exports.markOrderPaid = async (id) => {
  await Order.update(
    {
      payment_status: "paid",
      status: "processing",
    },
    {
      where: { id },
    }
  );

  return {
    message: "Payment success",
  };
};

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

exports.getPaymentStatus = async (id) => {
  const order = await Order.findByPk(id);

  if (!order)
    throw new Error("Order tidak ditemukan");

  return {
    payment_status: order.payment_status,
    status: order.status,
  };
};

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