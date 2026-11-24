import fs from "node:fs";
import path from "node:path";
import { sequelize } from "../config/db.js";

const run = async () => {
    const dir = path.resolve("src/config/migrations");
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    console.log(`Encontradas ${files.length} migraciones SQL en ${dir}`);

    for (const file of files) {
        const sql = fs.readFileSync(path.join(dir, file), "utf8");
        console.log(`→ Aplicando ${file}...`);
        await sequelize.query(sql);
        console.log(`✓ ${file} aplicada correctamente.`);
    }

    await sequelize.close();
    console.log("Todas las migraciones finalizaron con éxito.");
};

run().catch(async (err) => {
    console.error("Error aplicando migraciones:", err);
    await sequelize.close();
    process.exit(1);
});
