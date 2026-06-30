const { Menu } = require('../models')

exports.getAll = async (req, res) => {
  try {
    const menus = await Menu.findAll();
    res.status(200).json(menus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    res.status(201).json(menu);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    await Menu.update(req.body, { where: { id } });
    res.json({ message: 'menu updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;
    await Menu.destroy({ where: { id } });
    res.json({ message: 'menu deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};