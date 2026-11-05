import { QueryInterface, DataTypes } from "sequelize";

/**
 * Adds a boolean column `isActive` to the Users table.
 * Default is true, indicating the account is enabled.
 */
export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn("Users", "isActive", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn("Users", "isActive");
}
