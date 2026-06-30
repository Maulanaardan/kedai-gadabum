const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware(["admin"]), tableController.getAll);
router.post('/', authMiddleware, roleMiddleware(["admin"]), tableController.create);
router.put('/:id', authMiddleware, roleMiddleware(["admin"]), tableController.update);
router.delete('/:id', authMiddleware, roleMiddleware(["admin"]), tableController.destroy);

module.exports = router;