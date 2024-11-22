import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Tickets");

    if (!(tableDescription as Record<string, any>).sendInactiveMessage) {
      await queryInterface.addColumn("Tickets", "sendInactiveMessage", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Tickets");

    if ((tableDescription as Record<string, any>).sendInactiveMessage) {
      await queryInterface.removeColumn("Tickets", "sendInactiveMessage");
    }
  },
};
