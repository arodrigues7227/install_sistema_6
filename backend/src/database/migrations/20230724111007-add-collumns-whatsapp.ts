import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");

    return Promise.all([
      !(tableDescription as Record<string, any>).expiresInactiveMessage &&
        queryInterface.addColumn("Whatsapps", "expiresInactiveMessage", {
          type: DataTypes.STRING,
          defaultValue: "",
        }),
      !(tableDescription as Record<string, any>).inactiveMessage &&
        queryInterface.addColumn("Whatsapps", "inactiveMessage", {
          type: DataTypes.STRING,
          defaultValue: "",
        }),
      !(tableDescription as Record<string, any>).timeInactiveMessage &&
        queryInterface.addColumn("Whatsapps", "timeInactiveMessage", {
          type: DataTypes.STRING,
          defaultValue: "",
        }),
      !(tableDescription as Record<string, any>).maxUseBotQueuesNPS &&
        queryInterface.addColumn("Whatsapps", "maxUseBotQueuesNPS", {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        }),
      !(tableDescription as Record<string, any>).whenExpiresTicket &&
        queryInterface.addColumn("Whatsapps", "whenExpiresTicket", {
          type: DataTypes.STRING,
          defaultValue: "",
        }),
      !(tableDescription as Record<string, any>).expiresTicketNPS &&
        queryInterface.addColumn("Whatsapps", "expiresTicketNPS", {
          type: DataTypes.STRING,
          defaultValue: "",
        }),
    ].filter(Boolean)); // Filtra valores falsos, garantindo que só os necessários sejam executados.
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Whatsapps");

    return Promise.all([
      (tableDescription as Record<string, any>).expiresInactiveMessage &&
        queryInterface.removeColumn("Whatsapps", "expiresInactiveMessage"),
      (tableDescription as Record<string, any>).inactiveMessage &&
        queryInterface.removeColumn("Whatsapps", "inactiveMessage"),
      (tableDescription as Record<string, any>).timeInactiveMessage &&
        queryInterface.removeColumn("Whatsapps", "timeInactiveMessage"),
      (tableDescription as Record<string, any>).maxUseBotQueuesNPS &&
        queryInterface.removeColumn("Whatsapps", "maxUseBotQueuesNPS"),
      (tableDescription as Record<string, any>).whenExpiresTicket &&
        queryInterface.removeColumn("Whatsapps", "whenExpiresTicket"),
      (tableDescription as Record<string, any>).expiresTicketNPS &&
        queryInterface.removeColumn("Whatsapps", "expiresTicketNPS"),
    ].filter(Boolean)); // Filtra valores falsos, garantindo que só os necessários sejam executados.
  },
};
