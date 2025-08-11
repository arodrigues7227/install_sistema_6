import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Users", "number", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("Users", "notifications", {
        type: DataTypes.STRING,
        allowNull: true,
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "number"),
      queryInterface.removeColumn("Users", "notifications")
    ]);
  }
};