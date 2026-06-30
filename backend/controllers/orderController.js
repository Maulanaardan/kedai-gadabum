const orderService = require("../services/orderService");

// CREATE ORDER
exports.create = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("ERROR CREATE ORDER:", err);
    res.status(500).json({ error: err.message });
  }
};

//  WEBHOOK dari Midtrans (otomatis dipanggil saat user sudah bayar)
exports.midtransWebhook = async (req, res) => {
  try {
    const result = await orderService.midtransWebhook(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

//  CEK STATUS PEMBAYARAN (polling dari frontend)
exports.checkPaymentStatus = async (req, res) => {
  try {
    const result =
      await orderService.getPaymentStatus(
        req.params.id
      );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  GET ALL (ADMIN / GLOBAL)
exports.getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(); 
    res.status(200).json(result);                     
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// KHUSUS CASHIER
exports.getCashierOrders = async (req, res) => {
  try {
    const result = await orderService.getCashierOrders(); 
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  GET PAID (KITCHEN)
exports.getPaidOrders = async (req, res) => {
  try {
    const result = await orderService.getPaidOrders(); 
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  COMPLETE ORDER (kitchen selesai)
exports.completeOrder = async (req, res) => {
  try {
    const result =
      await orderService.completeOrder(
        req.params.id
      );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


exports.updateStatus = async (req, res) => {
  try {
    const result =
      await orderService.updateOrderStatus(
        req.params.id,
        req.body.status
      );

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const result =
      await orderService.markOrderPaid(
        req.params.id
      );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};