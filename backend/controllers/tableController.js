const { Table } = require('../models');
exports.getAll = async (req, res) => {
    const tables = await Table.findAll()
    res.json(tables);
};

exports.create = async (req,res) => {
    try {
        const { tableNumber } = req.body;

        const table = await Table.create({ tableNumber });
        res.status(201).json(table);
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

exports.update = async (req, res) => {
    const {id} = req.params;
    await Table.update(req.body, {where: {id}});
    res.json({message: 'Table updated'})
}

exports.destroy = async (req, res) => {
    const { id } = req.params;
    await Table.destroy({where: {id} });
    res.json({message: 'Table Deleted'})
}