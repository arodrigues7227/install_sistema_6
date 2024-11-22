import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Users");

    if (!(tableDescription as Record<string, any>).allTicket) {
      await queryInterface.addColumn("Users", "allTicket", {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "disable"
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Users");

    if ((tableDescription as Record<string, any>).allTicket) {
      await queryInterface.removeColumn("Users", "allTicket");
    }
  }
};
