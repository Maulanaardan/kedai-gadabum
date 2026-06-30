const { Table } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const tables = await Table.findAll();
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const table = await Table.create({ tableNumber });
    res.status(201).json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    await Table.update(req.body, { where: { id } });
    res.json({ message: 'Table updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;
    await Table.destroy({ where: { id } });
    res.json({ message: 'Table Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};