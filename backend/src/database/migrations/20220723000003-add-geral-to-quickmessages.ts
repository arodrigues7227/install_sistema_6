import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("QuickMessages");
    if (!(tableDescription as Record<string, any>).geral) {
      await queryInterface.addColumn("QuickMessages", "geral", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("QuickMessages");
    if ((tableDescription as Record<string, any>).geral) {
      await queryInterface.removeColumn("QuickMessages", "geral");
    }
  }
};
