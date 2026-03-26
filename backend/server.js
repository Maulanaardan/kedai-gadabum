const express = require("express");
const menuRoutes = require('./routes/menuRoute')
const tableRoutes = require('./routes/tableRoutes')
const orderRoutes = require('./routes/orderRoute')

const app = express()
app.use(express.json());
app.use('/menus', menuRoutes); 
app.use('/tables', tableRoutes);
app.use('/orders', orderRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server jalan di port ${PORT}`));
