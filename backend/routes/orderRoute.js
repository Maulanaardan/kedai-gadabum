const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🔓 PUBLIC (customer)
router.post('/', orderController.create);

// 🔒 ADMIN (lihat semua)
router.get("/", authMiddleware, roleMiddleware(["admin"]), orderController.getAll);

router.get("/cashier",authMiddleware,roleMiddleware(["cashier"]),orderController.getCashierOrders);

// 🔒 KITCHEN (lihat yang sudah dibayar)
router.get("/paid", authMiddleware, roleMiddleware(["kitchen"]), orderController.getPaidOrders);

// 🔒 KITCHEN (update status masak)
router.put("/:id/status", authMiddleware, roleMiddleware(["kitchen"]), orderController.updateStatus);

// 🔒 CASHIER / ADMIN (bayar)
router.put("/:id/pay", authMiddleware, roleMiddleware(["cashier", "admin"]), orderController.updatePayment);

// 🔒 KITCHEN (selesai masak)
router.put("/:id/complete", authMiddleware, roleMiddleware(["kitchen"]), orderController.completeOrder);

module.exports = router;