import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
    closeDB,
    initDB,
    sequelize,
    shouldSyncDatabase,
} from "../src/config/db.js";
import { ESTADO } from "../src/constants/estados.js";
import {
    Estado,
    Notificacion,
    PreferenciaNotificacion,
    Profile,
    Sector,
    Servicio,
    Solicitud,
    User,
} from "../src/models/index.js";
import { ESTADOS_SERVICIO } from "../src/models/servicio.model.js";
import {
    REFERENCIAS_NOTIFICACION,
    TIPOS_NOTIFICACION,
} from "../src/models/notificacion.model.js";
import {
    DEFAULT_PREFERENCIAS_NOTIFICACION,
} from "../src/models/preferenciaNotificacion.model.js";
import {
    down as downMigration,
    getDownSqlStatements,
    getUpSqlStatements,
    up as upMigration,
} from "../src/migrations/20261112-spec003-ux-management.js";
import * as userRepository from "../src/repositories/user.repository.js";
import { seedCatalogos } from "../src/services/catalogSeed.service.js";

test("1. ESTADO.CANCELADA está definido en constantes de estados", () => {
    assert.equal(ESTADO.CANCELADA, "CANCELADA");
    assert.ok(Object.values(ESTADO).includes("CANCELADA"));
});

test("2. Modelo Solicitud incluye atributos de seguimiento, observaciones y cancelación", () => {
    const attributes = Solicitud.getAttributes();
    assert.equal(Solicitud.tableName, "Solicituds");

    assert.ok(attributes.observaciones_cit, "Debe existir atributo observaciones_cit");
    assert.equal(attributes.observaciones_cit.allowNull, true);

    assert.ok(attributes.observaciones_internas, "Debe existir atributo observaciones_internas");
    assert.equal(attributes.observaciones_internas.allowNull, true);

    assert.ok(attributes.fecha_cancelacion, "Debe existir atributo fecha_cancelacion");
    assert.equal(attributes.fecha_cancelacion.allowNull, true);

    assert.ok(attributes.cancelado_por_id, "Debe existir atributo cancelado_por_id");
    assert.equal(attributes.cancelado_por_id.allowNull, true);

    const inst = Solicitud.build({
        user_id: 10,
        servicio_id: 20,
        estado_id: 1,
    });
    assert.equal(inst.observaciones_cit, null);
    assert.equal(inst.observaciones_internas, null);
    assert.equal(inst.fecha_cancelacion, null);
    assert.equal(inst.cancelado_por_id, null);
});

test("3. Modelo Servicio incluye estado_servicio (default ACTIVO), motivo_cancelacion y fecha_cambio_estado", async () => {
    const attributes = Servicio.getAttributes();
    assert.equal(Servicio.tableName, "Servicios");
    assert.deepEqual(ESTADOS_SERVICIO, ["ACTIVO", "ARCHIVADO", "CANCELADO"]);

    assert.ok(attributes.estado_servicio, "Debe existir atributo estado_servicio");
    assert.equal(attributes.estado_servicio.allowNull, false);
    assert.equal(attributes.estado_servicio.defaultValue, "ACTIVO");

    assert.ok(attributes.motivo_cancelacion, "Debe existir atributo motivo_cancelacion");
    assert.equal(attributes.motivo_cancelacion.allowNull, true);

    assert.ok(attributes.fecha_cambio_estado, "Debe existir atributo fecha_cambio_estado");
    assert.equal(attributes.fecha_cambio_estado.allowNull, true);

    const valido = Servicio.build({
        servicio_nombre: "Diagnóstico de suelos",
        servicio_description: "Análisis físico-químico de suelos agrícolas",
        sector_id: 1,
        servicio_precio: 15000,
        proveedor_id: 2,
    });
    assert.equal(valido.estado_servicio, "ACTIVO");
    assert.equal(valido.motivo_cancelacion, null);
    assert.equal(valido.fecha_cambio_estado, null);
    await valido.validate();

    const invalido = Servicio.build({
        servicio_nombre: "Servicio inválido",
        servicio_description: "Descripción válida",
        sector_id: 1,
        servicio_precio: 1000,
        proveedor_id: 2,
        estado_servicio: "ELIMINADO" as any,
    });
    await assert.rejects(() => invalido.validate());
});

test("4. Modelo Notificacion define estructura, defaults y validación de tipos", async () => {
    const attributes = Notificacion.getAttributes();
    assert.equal(Notificacion.tableName, "Notificaciones");
    assert.deepEqual(TIPOS_NOTIFICACION, [
        "NUEVA_PUBLICACION",
        "CAMBIO_ESTADO_PROPUESTA",
        "NUEVO_SERVICIO",
        "ACTUALIZACION_PLATAFORMA",
        "ACTIVIDAD_USUARIO",
    ]);
    assert.deepEqual(REFERENCIAS_NOTIFICACION, [
        "publicacion",
        "propuesta",
        "servicio",
        "solicitud",
        "sistema",
    ]);

    assert.ok(attributes.user_id);
    assert.ok(attributes.tipo);
    assert.ok(attributes.titulo);
    assert.ok(attributes.mensaje);
    assert.ok(attributes.enlace);
    assert.ok(attributes.referencia_tipo);
    assert.ok(attributes.referencia_id);
    assert.ok(attributes.leida);
    assert.ok(attributes.fecha_lectura);

    const notif = Notificacion.build({
        user_id: 5,
        tipo: "NUEVO_SERVICIO",
        titulo: "Nuevo servicio disponible",
        mensaje: "El servicio de análisis foliar ya se encuentra activo en el catálogo.",
        enlace: "/servicios/12",
        referencia_tipo: "servicio",
        referencia_id: 12,
    });
    assert.equal(notif.leida, false);
    assert.equal(notif.fecha_lectura, null);
    await notif.validate();

    const notifInvalida = Notificacion.build({
        user_id: 5,
        tipo: "TIPO_INEXISTENTE" as any,
        titulo: "Aviso",
        mensaje: "Mensaje",
    });
    await assert.rejects(() => notifInvalida.validate());
});

test("5. Modelo PreferenciaNotificacion define las 5 categorías en true y un único índice único sobre user_id", async () => {
    const attributes = PreferenciaNotificacion.getAttributes();
    assert.equal(PreferenciaNotificacion.tableName, "PreferenciasNotificaciones");
    assert.equal(attributes.user_id.allowNull, false);
    assert.equal(
        attributes.user_id.unique,
        undefined,
        "La unicidad debe definirse una sola vez en options.indexes (uq_preferencias_notificaciones_user_id)",
    );

    const indexes = PreferenciaNotificacion.options.indexes ?? [];
    assert.equal(indexes.length, 1);
    assert.equal(indexes[0]?.name, "uq_preferencias_notificaciones_user_id");
    assert.equal(indexes[0]?.unique, true);

    const pref = PreferenciaNotificacion.build({
        user_id: 7,
    });
    assert.equal(pref.noticias_publicaciones, true);
    assert.equal(pref.cambios_propuestas, true);
    assert.equal(pref.nuevos_servicios, true);
    assert.equal(pref.actualizaciones_plataforma, true);
    assert.equal(pref.actividad_usuario, true);
    await pref.validate();
});

test("6. Asociaciones Sequelize de Bloque 0 protegen integridad histórica (RESTRICT / SET NULL)", () => {
    assert.ok(User.associations.Notificaciones, "User debe tener asociación Notificaciones");
    assert.equal(
        (User.associations.Notificaciones as any).options.onDelete,
        "RESTRICT",
        "Notificaciones no debe borrarse en cascada ante eliminación accidental de User",
    );

    assert.ok(
        User.associations.PreferenciaNotificacion,
        "User debe tener asociación PreferenciaNotificacion",
    );
    assert.equal(
        (User.associations.PreferenciaNotificacion as any).options.onDelete,
        "RESTRICT",
    );

    assert.ok(
        User.associations.SolicitudesCanceladas,
        "User debe tener asociación SolicitudesCanceladas",
    );
    assert.equal(
        (User.associations.SolicitudesCanceladas as any).options.onDelete,
        "SET NULL",
    );

    assert.ok(
        Solicitud.associations.CanceladoPor,
        "Solicitud debe tener asociación CanceladoPor",
    );
    assert.equal(
        (Solicitud.associations.CanceladoPor as any).options.onDelete,
        "SET NULL",
    );

    assert.ok(
        Notificacion.associations.Destinatario,
        "Notificacion debe tener asociación Destinatario",
    );
    assert.ok(
        PreferenciaNotificacion.associations.User,
        "PreferenciaNotificacion debe tener asociación User",
    );
    assert.ok(
        Estado.associations.Solicitudes,
        "Estado debe conservar asociación Solicitudes",
    );
});

test("7. seedCatalogos() solo pobla Sectores y Estados (incluyendo CANCELADA) sin ejecutar DDL ni migraciones", async () => {
    const originalQuery = sequelize.query;
    const originalSectorFindOrCreate = Sector.findOrCreate;
    const originalEstadoFindOrCreate = Estado.findOrCreate;

    const rawSqlCalls: unknown[] = [];
    const sectoresUpserted: string[] = [];
    const estadosUpserted: string[] = [];

    (sequelize as any).query = async (...args: unknown[]) => {
        rawSqlCalls.push(args);
        throw new Error("seedCatalogos no debe invocar sequelize.query con DDL");
    };
    (Sector as any).findOrCreate = async (opts: { where: { codigo: string }; defaults: { codigo: string; nombre: string } }) => {
        sectoresUpserted.push(opts.where.codigo);
        return [Sector.build(opts.defaults), false];
    };
    (Estado as any).findOrCreate = async (opts: { where: { codigo: string }; defaults: { codigo: string; nombre: string } }) => {
        estadosUpserted.push(opts.where.codigo);
        return [Estado.build(opts.defaults), false];
    };

    try {
        await seedCatalogos();
        assert.equal(rawSqlCalls.length, 0, "No debe ejecutar sentencias SQL crudas en el arranque");
        assert.deepEqual(sectoresUpserted, ["AGRICOLA", "GANADERO", "FRUTIHORTICOLA"]);
        assert.deepEqual(estadosUpserted, [
            "PENDIENTE",
            "EN_REVISION",
            "APROBADO",
            "RECHAZADO",
            "ACEPTADA",
            "FINALIZADA",
            "CANCELADA",
        ]);
    } finally {
        sequelize.query = originalQuery;
        Sector.findOrCreate = originalSectorFindOrCreate;
        Estado.findOrCreate = originalEstadoFindOrCreate;
    }
});

test("8. ensureDefaultNotificationPreferences maneja inserción atómica mediante ON CONFLICT DO NOTHING (evitando abortos transaccionales 23505)", async () => {
    const originalQuery = sequelize.query;
    const originalFindOne = PreferenciaNotificacion.findOne;

    const queryCalls: Array<{ sql: string; options: any }> = [];
    let findOneCalls = 0;

    (sequelize as any).query = async (sql: string, options: any) => {
        queryCalls.push({ sql, options });
        return [[], 0];
    };

    (PreferenciaNotificacion as any).findOne = async (options: { where: { user_id: number } }) => {
        findOneCalls += 1;
        return PreferenciaNotificacion.build({
            user_id: options.where.user_id,
            ...DEFAULT_PREFERENCIAS_NOTIFICACION,
        });
    };

    try {
        const fakeTx = { id: "tx-test-atomic" } as any;
        const result = await userRepository.ensureDefaultNotificationPreferences(99, fakeTx);

        assert.equal(queryCalls.length, 1, "Debe ejecutar la consulta atómica INSERT ... ON CONFLICT DO NOTHING");
        assert.match(
            queryCalls[0].sql,
            /ON CONFLICT \("user_id"\) DO NOTHING/,
            "La sentencia debe garantizar idempotencia a nivel motor relacional",
        );
        assert.equal(queryCalls[0].options.transaction, fakeTx, "Debe propagar la transacción externa");
        assert.equal(queryCalls[0].options.replacements.userId, 99);

        assert.equal(findOneCalls, 1, "Debe recuperar la fila asegurada tras el INSERT ON CONFLICT");
        assert.equal(result.user_id, 99);
        assert.equal(result.nuevos_servicios, true);
    } finally {
        sequelize.query = originalQuery;
        PreferenciaNotificacion.findOne = originalFindOne;
    }
});

test("8b. Simulación de carrera concurrente entre dos transacciones: ambas completan con éxito sin aborto", async () => {
    const originalQuery = sequelize.query;
    const originalFindOne = PreferenciaNotificacion.findOne;

    let databaseStore: Record<number, boolean> = {};

    // Simulamos el motor PostgreSQL con ON CONFLICT DO NOTHING:
    // Si la clave ya está tomada, no arroja 23505 sino que simplemente no inserta (DO NOTHING)
    (sequelize as any).query = async (_sql: string, options: any) => {
        const uid = options.replacements.userId;
        if (!databaseStore[uid]) {
            databaseStore[uid] = true;
        }
        return [[], 0];
    };

    (PreferenciaNotificacion as any).findOne = async (options: { where: { user_id: number } }) => {
        const uid = options.where.user_id;
        if (databaseStore[uid]) {
            return PreferenciaNotificacion.build({
                user_id: uid,
                ...DEFAULT_PREFERENCIAS_NOTIFICACION,
            });
        }
        return null;
    };

    try {
        const tx1 = { id: "tx-1" } as any;
        const tx2 = { id: "tx-2" } as any;

        // Ambas transacciones corren concurrentemente para el mismo user_id
        const [res1, res2] = await Promise.all([
            userRepository.ensureDefaultNotificationPreferences(101, tx1),
            userRepository.ensureDefaultNotificationPreferences(101, tx2),
        ]);

        assert.equal(res1.user_id, 101);
        assert.equal(res2.user_id, 101);
        assert.ok(res1 && res2, "Ambas transacciones deben resolver con éxito sin quedar en estado abortado");
    } finally {
        sequelize.query = originalQuery;
        PreferenciaNotificacion.findOne = originalFindOne;
    }
});

test("9. userRepository.create y createUserWithProfile crean usuario y preferencias en la misma transacción y hacen rollback si falla", async () => {
    const originalTransaction = sequelize.transaction;
    const originalQuery = sequelize.query;
    const originalUserCreate = User.create;
    const originalProfileCreate = Profile.create;
    const originalPrefFindOne = PreferenciaNotificacion.findOne;

    let committed = false;
    let rolledBack = false;
    const txToken = {
        commit: async () => {
            committed = true;
        },
        rollback: async () => {
            rolledBack = true;
        },
    };

    const recordedTransactions: unknown[] = [];

    (sequelize as any).transaction = async () => txToken;
    (User as any).create = async (data: any, opts: { transaction?: unknown }) => {
        recordedTransactions.push(opts?.transaction);
        return User.build({ id: 77, ...data });
    };
    (Profile as any).create = async (data: any, opts: { transaction?: unknown }) => {
        recordedTransactions.push(opts?.transaction);
        return Profile.build({ id: 1, ...data });
    };
    (sequelize as any).query = async (_sql: string, opts: { transaction?: unknown }) => {
        recordedTransactions.push(opts?.transaction);
        return [[], 0];
    };
    (PreferenciaNotificacion as any).findOne = async (opts: { where: { user_id: number }; transaction?: unknown }) => {
        recordedTransactions.push(opts?.transaction);
        return PreferenciaNotificacion.build({
            user_id: opts.where.user_id,
            ...DEFAULT_PREFERENCIAS_NOTIFICACION,
        });
    };

    try {
        const createdWithProfile = await userRepository.createUserWithProfile(
            {
                username: "nuevo_user",
                email: "nuevo@cit.test",
                password: "hashedPassword",
                role: "user",
            },
            {
                first_name: "Nuevo",
                last_name: "Usuario",
            },
        );

        assert.equal(createdWithProfile.id, 77);
        assert.equal(committed, true, "Debe confirmar la transacción cuando todos los pasos tienen éxito");
        assert.equal(rolledBack, false);
        assert.equal(recordedTransactions.length, 4, "User.create, Profile.create, sequelize.query y findOne");
        assert.ok(
            recordedTransactions.every((t) => t === txToken),
            "User, Profile y PreferenciaNotificacion deben compartir exactamente el mismo token de transacción",
        );

        // Ahora simulamos un fallo al ejecutar la consulta de inserción de preferencias
        committed = false;
        rolledBack = false;
        (sequelize as any).query = async () => {
            throw new Error("DB error simulado en preferences insert");
        };

        await assert.rejects(() =>
            userRepository.create({
                username: "admin_nuevo",
                email: "admin_nuevo@cit.test",
                password: "hashedPassword",
                role: "admin",
            }),
        );
        assert.equal(committed, false);
        assert.equal(rolledBack, true, "Debe revertir la transacción completa si falla la creación de preferencias");
    } finally {
        sequelize.transaction = originalTransaction;
        sequelize.query = originalQuery;
        User.create = originalUserCreate;
        Profile.create = originalProfileCreate;
        PreferenciaNotificacion.findOne = originalPrefFindOne;
    }
});

test("10. Migración SQL y wrapper QueryInterface verifican consistencia UP/DOWN y políticas ON DELETE RESTRICT", async () => {
    const migrationSqlPath = path.resolve(
        process.cwd(),
        "src/config/migrations/003_spec003_ux_management.sql",
    );
    assert.ok(fs.existsSync(migrationSqlPath));

    const upSql = getUpSqlStatements();
    const downSql = getDownSqlStatements();

    // Verificaciones del bloque UP
    assert.match(upSql, /ON CONFLICT \("codigo"\) DO UPDATE/);
    assert.match(upSql, /CONSTRAINT "fk_notificaciones_user"[\s\S]*?ON DELETE RESTRICT/);
    assert.match(upSql, /CONSTRAINT "fk_preferencias_notificaciones_user"[\s\S]*?ON DELETE RESTRICT/);
    assert.match(upSql, /CONSTRAINT "fk_solicituds_cancelado_por_user"[\s\S]*?ON DELETE SET NULL/);
    assert.match(upSql, /ON CONFLICT \("user_id"\) DO NOTHING/);
    assert.doesNotMatch(
        upSql,
        /idx_preferencias_notificaciones_user_id/,
        "No debe crear un segundo índice duplicado sobre PreferenciasNotificaciones(user_id)",
    );

    // Verificaciones del bloque DOWN
    assert.match(downSql, /DROP TABLE IF EXISTS public\."PreferenciasNotificaciones"/);
    assert.match(downSql, /DROP TABLE IF EXISTS public\."Notificaciones"/);
    assert.match(downSql, /ALTER TABLE public\."Servicios" DROP COLUMN IF EXISTS "estado_servicio"/);
    assert.match(downSql, /ALTER TABLE public\."Solicituds" DROP COLUMN IF EXISTS "cancelado_por_id"/);
    assert.match(downSql, /UPDATE public\."Estados"\s+SET "activo" = false\s+WHERE "codigo" = 'CANCELADA'/);

    // Verificar ejecución del wrapper TypeScript con un QueryInterface simulado
    const executedQueries: string[] = [];
    const mockQueryInterface = {
        sequelize: {
            query: async (sql: string) => {
                executedQueries.push(sql);
                return [[], 0];
            },
        },
    } as any;

    await upMigration(mockQueryInterface);
    await downMigration(mockQueryInterface);

    assert.equal(executedQueries.length, 2);
    assert.equal(executedQueries[0], upSql);
    assert.equal(executedQueries[1], downSql);
});

test("11. Verificación de políticas DB_SYNC: sincronización solo con habilitación explícita", () => {
    // 1. Desarrollo + DB_SYNC=false: NO debe sincronizar
    assert.equal(
        shouldSyncDatabase({ sync: false }, false),
        false,
        "Desarrollo con DB_SYNC=false no debe ejecutar sync",
    );

    // 2. Producción + DB_SYNC=false: NO debe sincronizar
    assert.equal(
        shouldSyncDatabase({ sync: false }, true),
        false,
        "Producción con DB_SYNC=false no debe ejecutar sync",
    );

    // 3. Desarrollo + DB_SYNC=true: SÍ debe sincronizar (habilitación explícita)
    assert.equal(
        shouldSyncDatabase({ sync: true }, false),
        true,
        "Desarrollo con DB_SYNC=true explícito debe ejecutar sync",
    );

    // 4. Producción + DB_SYNC=true: NO debe sincronizar (protección en producción)
    assert.equal(
        shouldSyncDatabase({ sync: true }, true),
        false,
        "Producción con DB_SYNC=true debe ser bloqueado por seguridad operativa",
    );
});
