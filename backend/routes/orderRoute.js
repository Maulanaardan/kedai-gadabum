const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post('/', orderController.create);
router.get("/", orderController.getAll);
router.put("/:id/status", orderController.updateStatus);
router.put("/:id/pay", orderController.updatePayment);
router.get("/paid", orderController.getPaidOrders);
router.put("/:id/complete", orderController.completeOrder);

module.exports = router;