require("dotenv").config();
const express = require("express");
const menuRoutes = require('./routes/menuRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require("./routes/authRoutes");
const helmet = require("helmet");

const { sequelize } = require("./models");

const app = express();
const cors = require("cors");

// Di belakang proxy Railway (1 lapis): perlu agar IP asli terbaca oleh rate limiter
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

app.use(express.json());

app.use('/menus', menuRoutes); 
app.use('/tables', tableRoutes);
app.use('/orders', orderRoutes); 
app.use("/auth", authRoutes);

app.use('/menus', menuRoutes); 
app.use('/tables', tableRoutes);
app.use('/orders', orderRoutes); 
app.use("/auth", authRoutes);

// Error handler harus paling bawah, setelah semua routes
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error("UNHANDLED ERROR:", err);
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : err.message,
  });
});

const PORT = process.env.PORT || 5000;

// 🔥 UBAH JADI BEGINI
sequelize.sync().then(async () => {
  console.log("Database synced");
  app.listen(PORT, () => console.log(`server jalan di port ${PORT}`));
  
  if (process.env.NODE_ENV === "development") {
    await createUsers();
  }
});

const bcrypt = require("bcrypt");
const { User } = require("./models");

const createUsers = async () => {
  const users = [
  {
    username: "admin",
    password: "admin123",
    roles: ["admin"],
  },
  {
    username: "kitchen",
    password: "123",
    roles: ["kitchen"],
  },
  {
    username: "cashier",
    password: "123",
    roles: ["cashier"],
  },
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