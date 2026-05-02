const express = require("express");
const menuRoutes = require('./routes/menuRoute');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoute');
const authRoutes = require("./routes/authRoute");

const { sequelize } = require("./models");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.use('/menus', menuRoutes); 
app.use('/tables', tableRoutes);
app.use('/orders', orderRoutes); 
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;

// 🔥 UBAH JADI BEGINI
sequelize.sync({ alter: true }).then( async() => {
  console.log("Database synced");

  app.listen(PORT, () => {
    console.log(`server jalan di port ${PORT}`);
  });
  await createUsers(); // 👈 ini bikin user otomatis
});

const bcrypt = require("bcrypt");
const { User } = require("./models");

const createUsers = async () => {
  const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "kitchen", password: "123", role: "kitchen" },
    { username: "kasir", password: "123", role: "cashier" },
  ];

  for (let u of users) {
    const existing = await User.findOne({ where: { username: u.username } });

    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, password: hashed });
    }
  }

  console.log("Users ready");
};