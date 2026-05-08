module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    roles: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  });

  return User;
};