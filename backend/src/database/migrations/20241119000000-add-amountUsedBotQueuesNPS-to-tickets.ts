import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Tickets");

    if (!(tableDescription as Record<string, any>).amountUsedBotQueuesNPS) {
      await queryInterface.addColumn("Tickets", "amountUsedBotQueuesNPS", {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Tickets");

    if ((tableDescription as Record<string, any>).amountUsedBotQueuesNPS) {
      await queryInterface.removeColumn("Tickets", "amountUsedBotQueuesNPS");
    }
  },
};
