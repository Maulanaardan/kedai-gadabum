const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Publik: pelanggan perlu lihat menu setelah scan QR
router.get('/', menuController.getAll);

// Hanya admin yang boleh mengubah menu
router.post('/', authMiddleware, roleMiddleware(['admin']), menuController.create);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), menuController.update);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), menuController.destroy);

module.exports = router;