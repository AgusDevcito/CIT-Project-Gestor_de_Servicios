import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    await queryInterface.createTable("CitActivationTokens", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        token_hash: { type: DataTypes.STRING, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        used_at: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    // Optional foreign key constraint – not enforced strictly to keep migrations simple
    await queryInterface.addConstraint("CitActivationTokens", {
        fields: ["user_id"],
        type: "foreign key",
        name: "fk_citactivation_user",
        references: {
            table: "Users",
            field: "id",
        },
        onDelete: "cascade",
        onUpdate: "cascade",
    });
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("CitActivationTokens");
}
