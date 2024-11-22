import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Users", "canDeleteMessage", {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Users", "canDeleteMessage");
  }
};
