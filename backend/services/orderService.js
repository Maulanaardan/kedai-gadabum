const { Order, Table, OrderItem, Menu } = require("../models");
const paymentService = require("../services/paymentService");
//create data
exports.createOrder = async (data) => {
  const { tableNumber, item, payment_method } = data;

  if (!tableNumber || !item || !Array.isArray(item)) {
    throw new Error("Data tidak lengkap");
  }

  const orderCode = "ORD-" + Date.now();

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
      sub_total,
    });
  }

  await Order.update(
    { total_price: total },
    { where: { id: order.id } }
  );

  // kalau qris
if (payment_method === "qris") {
  const payment =
    await paymentService.createQrisPayment({
      orderCode,
      total,
    });

  await Order.update(
    {
      qr_url: payment.qr_url,
      payment_token: payment.payment_token,
    },
    {
      where: { id: order.id },
    }
  );

  const updatedOrder =
    await Order.findByPk(order.id);

  return {
    message: "Order berhasil",
    order: updatedOrder,
    qr_url: payment.qr_url,
  };
}

  return {
    message: "Order berhasil",
    order,
  };
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