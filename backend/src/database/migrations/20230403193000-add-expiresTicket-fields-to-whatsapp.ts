import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");
    if (!(tableDescription as Record<string, any>).expiresTicket) {
      await queryInterface.addColumn("Whatsapps", "expiresTicket", {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");
    if ((tableDescription as Record<string, any>).expiresTicket) {
      await queryInterface.removeColumn("Whatsapps", "expiresTicket");
    }
  }
};
