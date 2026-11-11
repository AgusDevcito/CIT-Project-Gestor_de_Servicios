import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    await queryInterface.createTable("CitApplications", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        dni: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        dni_front_path: { type: DataTypes.STRING, allowNull: false },
        dni_back_path: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), allowNull: false, defaultValue: 'PENDING' },
        reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
        reviewed_at: { type: DataTypes.DATE, allowNull: true },
        rejection_reason: { type: DataTypes.TEXT, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    // Unique pending DNI constraint using a partial index (PostgreSQL syntax)
    // Note: Sequelize's queryInterface does not support partial indexes directly; we use raw SQL.
    await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX "unique_pending_dni" ON "CitApplications" (dni) WHERE status = 'PENDING';`
    );
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("CitApplications");
}
