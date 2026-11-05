import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    await queryInterface.createTable("OutboxNotifications", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        recipient: { type: DataTypes.STRING, allowNull: false },
        subject: { type: DataTypes.STRING, allowNull: false },
        body: { type: DataTypes.TEXT, allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "SENT", "FAILED"), allowNull: false, defaultValue: "PENDING" },
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("OutboxNotifications");
}
