import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");

    if (!(tableDescription as Record<string, any>).ratingMessage) {
      await queryInterface.addColumn("Whatsapps", "ratingMessage", {
        type: DataTypes.TEXT,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");

    if ((tableDescription as Record<string, any>).ratingMessage) {
      await queryInterface.removeColumn("Whatsapps", "ratingMessage");
    }
  },
};
