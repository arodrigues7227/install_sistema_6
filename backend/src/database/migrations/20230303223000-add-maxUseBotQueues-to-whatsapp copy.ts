import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");
    if (!(tableDescription as Record<string, any>).maxUseBotQueues) {
      await queryInterface.addColumn("Whatsapps", "maxUseBotQueues", {
        type: DataTypes.INTEGER,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");
    if ((tableDescription as Record<string, any>).maxUseBotQueues) {
      await queryInterface.removeColumn("Whatsapps", "maxUseBotQueues");
    }
  }
};
