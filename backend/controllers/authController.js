const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });

  if (!user) {
    return res.status(404).json({
      error: "User tidak ditemukan",
    });
  }

  const match = await bcrypt.compare(
    password,
    user.password
  );

  if (!match) {
    return res.status(400).json({
      error: "Password salah",
    });
  }

  const roles = user.roles;

  const token = jwt.sign(
    {
      id: user.id,
      roles,
    },
    "SECRET_KEY",
    {
      expiresIn: "1d",
    }
  );

  // 🔥 redirect otomatis
  let redirect = "/login";

  if (roles.includes("admin")) {
    redirect = "/dashboard";
  } else if (roles.includes("cashier")) {
    redirect = "/orderlists";
  } else if (roles.includes("kitchen")) {
    redirect = "/dashboardkitchen";
  }

  res.json({
    token,
    roles,
    redirect,
  });
};