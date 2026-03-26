const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/test-relasi", orderController.testRelasi);

module.exports = router;