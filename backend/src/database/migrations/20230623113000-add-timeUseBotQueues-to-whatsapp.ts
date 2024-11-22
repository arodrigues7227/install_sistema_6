import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");
    if (!(tableDescription as Record<string, any>).timeUseBotQueues) {
      await queryInterface.addColumn("Whatsapps", "timeUseBotQueues", {
        type: DataTypes.STRING,
        defaultValue: "0",
        allowNull: false,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");
    if ((tableDescription as Record<string, any>).timeUseBotQueues) {
      await queryInterface.removeColumn("Whatsapps", "timeUseBotQueues");
    }
  }
};
