module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('Plans', 'onlyApiMessage', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    },
  
    down: async (queryInterface) => {
      await queryInterface.removeColumn('Plans', 'onlyApiMessage');
    }
  };