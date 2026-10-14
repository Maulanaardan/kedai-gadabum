const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Hash bohongan, dipakai agar waktu respons sama baik user ada maupun tidak
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

exports.login = async (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }

  const user = await User.findOne({ where: { username } });

  // Selalu jalankan compare, supaya waktu respons tidak membocorkan apakah user ada
  const match = await bcrypt.compare(
    password,
    user ? user.password : DUMMY_HASH
  );

  if (!user || !match) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  const roles = user.roles;

  const token = jwt.sign(
    {
      id: user.id,
      roles,
    },
    process.env.JWT_SECRET,
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