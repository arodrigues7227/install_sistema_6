import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const [results] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'Contacts' 
      AND CONSTRAINT_TYPE = 'UNIQUE' 
      AND CONSTRAINT_NAME = 'number_companyid_unique';
    `);

    if (results.length === 0) {
      await queryInterface.addConstraint("Contacts", ["number", "companyId"], {
        type: "unique",
        name: "number_companyid_unique",
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const [results] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'Contacts' 
      AND CONSTRAINT_TYPE = 'UNIQUE' 
      AND CONSTRAINT_NAME = 'number_companyid_unique';
    `);

    if (results.length > 0) {
      await queryInterface.removeConstraint(
        "Contacts",
        "number_companyid_unique"
      );
    }
  }
};
