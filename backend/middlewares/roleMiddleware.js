module.exports = (allowedRoles) => {
  return (req, res, next) => {
    let userRoles = req.user.roles;

    // 🔥 kalau string -> ubah jadi array
    if (!Array.isArray(userRoles)) {
      userRoles = [userRoles];
    }

    const hasRole = userRoles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
};