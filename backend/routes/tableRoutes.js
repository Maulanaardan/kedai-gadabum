const express = require('express');
const router = express.Router()
const tableController = require('../controllers/tableController');

router.get('/', tableController.getAll);
router.post('/', tableController.create);
router.put('/:id', tableController.update);
router.delete('/:id', tableController.destroy);

module.exports = router;