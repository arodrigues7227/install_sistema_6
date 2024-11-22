import { QueryInterface } from "sequelize";
import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const [results] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'Tickets' AND constraint_name = 'contactid_companyid_unique';
    `);

    if (results.length > 0) {
      await queryInterface.removeConstraint(
        "Tickets",
        "contactid_companyid_unique"
      );
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const [results] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'Tickets' AND constraint_name = 'contactid_companyid_unique';
    `);

    if (results.length > 0) {
      await queryInterface.removeConstraint(
        "Tickets",
        "contactid_companyid_unique"
      );
    }
  },
};