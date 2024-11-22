import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Messages");

    if (!(tableDescription as Record<string, any>).isForwarded) {
      await queryInterface.addColumn("Messages", "isForwarded", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Messages");

    if ((tableDescription as Record<string, any>).isForwarded) {
      await queryInterface.removeColumn("Messages", "isForwarded");
    }
  }
};
