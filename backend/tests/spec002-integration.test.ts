import test, { after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";
import { closeDB, initDB } from "../src/config/db.js";
import { ROL } from "../src/constants/roles.js";
import { hashPassword } from "../src/helpers/password.js";
import * as userRepository from "../src/repositories/user.repository.js";
import { seedCatalogos } from "../src/services/catalogSeed.service.js";

await initDB();
await seedCatalogos();

const unique = Date.now();
const passwordPlain = "Spec002Pass!123";
const passwordHash = await hashPassword(passwordPlain);

const userA = await userRepository.createUserWithProfile(
    {
        username: `usera_${unique}`,
        email: `usera_${unique}@cit.test`,
        password: passwordHash,
        role: ROL.USER,
    },
    {
        first_name: "Ana",
        last_name: "Productora",
    },
);

const userB = await userRepository.createUserWithProfile(
    {
        username: `userb_${unique}`,
        email: `userb_${unique}@cit.test`,
        password: passwordHash,
        role: ROL.USER,
    },
    {
        first_name: "Beto",
        last_name: "Vecino",
    },
);

const citUser = await userRepository.createUserWithProfile(
    {
        username: `cit_${unique}`,
        email: `cit_${unique}@cit.test`,
        password: passwordHash,
        role: ROL.CIT,
    },
    {
        first_name: "Carlos",
        last_name: "TecnicoCIT",
    },
);

const adminUser = await userRepository.createUserWithProfile(
    {
        username: `admin_${unique}`,
        email: `admin_${unique}@cit.test`,
        password: passwordHash,
        role: ROL.ADMIN,
    },
    {
        first_name: "Diana",
        last_name: "AdminCIT",
    },
);

async function getBearerToken(usernameOrEmail: string): Promise<string> {
    const res = await request(app)
        .post("/api/login")
        .send({ username: usernameOrEmail, password: passwordPlain })
        .expect(200);
    assert.ok(res.body.token, "Login debe devolver JWT token");
    return `Bearer ${res.body.token}`;
}

const tokenUserA = await getBearerToken(userA.username);
const tokenUserB = await getBearerToken(userB.email); // Verifica login por email
const tokenCIT = await getBearerToken(citUser.username);
const tokenAdmin = await getBearerToken(adminUser.username);

let createdServicioId = 0;
let createdPublicacionId = 0;
let createdCapacitacionId = 0;
let createdPropuestaId = 0;

after(async () => {
    await closeDB();
});

test("1. Catálogos (Sectores y Estados) son accesibles para todos los roles y visitantes", async () => {
    const resSectores = await request(app).get("/api/sectores").expect(200);
    assert.ok(Array.isArray(resSectores.body.data));
    assert.ok(resSectores.body.data.length >= 3);

    const resEstados = await request(app)
        .get("/api/estados")
        .set("Authorization", tokenUserA)
        .expect(200);
    assert.ok(Array.isArray(resEstados.body.data));
    const codigos = resEstados.body.data.map((e: { codigo: string }) => e.codigo);
    assert.ok(codigos.includes("PENDIENTE"));
    assert.ok(codigos.includes("EN_REVISION"));
});

test("2. Servicios: rol 'user' no puede crear servicios (403); 'cit' y 'admin' pueden crearlos y todos pueden consultarlos", async () => {
    await request(app)
        .post("/api/servicios")
        .set("Authorization", tokenUserA)
        .send({
            servicio_nombre: `Servicio No Autorizado ${unique}`,
            servicio_description: "Intento de creación por usuario normal",
            servicio_precio: 5000,
            sector: "GANADERO",
        })
        .expect(403);

    const createRes = await request(app)
        .post("/api/servicios")
        .set("Authorization", tokenCIT)
        .send({
            servicio_nombre: `Diagnóstico Coprológico ${unique}`,
            servicio_description: "Recuento de huevos por gramo (HPG) en rumiantes.",
            servicio_precio: 12000,
            sector: "GANADERO",
        })
        .expect(201);

    createdServicioId = createRes.body.data.id;
    assert.ok(createdServicioId > 0);

    const listRes = await request(app)
        .get("/api/servicios")
        .set("Authorization", tokenUserA)
        .expect(200);
    assert.ok(
        listRes.body.data.some((s: { id: number }) => s.id === createdServicioId),
    );
});

test("3. Contratación y Reseñas: solo 'user' puede contratar (D-01), evita solicitudes duplicadas (409) y valida reseñas verificadas", async () => {
    // CIT no puede contratar servicios (D-01) -> 403
    await request(app)
        .post("/api/solicitudes")
        .set("Authorization", tokenCIT)
        .send({ servicio_id: createdServicioId })
        .expect(403);

    // UserB (que no contrató el servicio) no puede calificarlo -> 403
    await request(app)
        .post(`/api/servicios/${createdServicioId}/resenas`)
        .set("Authorization", tokenUserB)
        .send({
            calificacion: 5,
            comentario: "Intento de reseña sin haber contratado el servicio.",
        })
        .expect(403);

    // UserA contrata el servicio -> 201
    await request(app)
        .post("/api/solicitudes")
        .set("Authorization", tokenUserA)
        .send({ servicio_id: createdServicioId })
        .expect(201);

    // UserA intenta contratar nuevamente el mismo servicio activo -> 409 Conflict
    await request(app)
        .post("/api/solicitudes")
        .set("Authorization", tokenUserA)
        .send({ servicio_id: createdServicioId })
        .expect(409);

    // UserA califica el servicio contratado -> 201
    await request(app)
        .post(`/api/servicios/${createdServicioId}/resenas`)
        .set("Authorization", tokenUserA)
        .send({
            calificacion: 5,
            comentario: "Excelente atención técnica del laboratorio del CIT.",
        })
        .expect(201);

    // UserA intenta volver a calificar el mismo servicio -> 409 Conflict
    await request(app)
        .post(`/api/servicios/${createdServicioId}/resenas`)
        .set("Authorization", tokenUserA)
        .send({
            calificacion: 4,
            comentario: "Segunda reseña duplicada no permitida.",
        })
        .expect(409);
});

test("4. Publicaciones y Capacitaciones: control de permisos, visibilidad de borradores e inscripción", async () => {
    // UserA no puede crear publicaciones -> 403
    await request(app)
        .post("/api/publicacion")
        .set("Authorization", tokenUserA)
        .send({
            titulo: "Intento no autorizado",
            contenido: "Contenido de prueba",
            tipo_contenido: "noticia",
            sector: "AGRICOLA",
        })
        .expect(403);

    // Admin crea una publicación en borrador (publicado: false)
    const draftRes = await request(app)
        .post("/api/publicacion")
        .set("Authorization", tokenAdmin)
        .send({
            titulo: `Borrador Interno CIT ${unique}`,
            contenido: "Anuncio interno en preparación.",
            tipo_contenido: "noticia",
            sector: "AGRICOLA",
            publicado: false,
        })
        .expect(201);

    createdPublicacionId = draftRes.body.data.id;

    // UserA no ve el borrador en el listado público ni por ID (404)
    const listUser = await request(app)
        .get("/api/publicaciones")
        .set("Authorization", tokenUserA)
        .expect(200);
    assert.ok(
        !listUser.body.data.some((p: { id: number }) => p.id === createdPublicacionId),
    );
    await request(app)
        .get(`/api/publicacion/${createdPublicacionId}`)
        .set("Authorization", tokenUserA)
        .expect(404);

    // UserA tampoco puede listar adjuntos de un borrador (D-03) -> 404
    await request(app)
        .get(`/api/publicacion/${createdPublicacionId}/archivos`)
        .set("Authorization", tokenUserA)
        .expect(404);

    // Esquema inválido en archivo_url es rechazado con 400 (D-03)
    await request(app)
        .post(`/api/publicacion/${createdPublicacionId}/archivos`)
        .set("Authorization", tokenAdmin)
        .send({
            tipo: "imagen",
            archivo_url: "javascript:alert(1)",
            archivo_nombre: "Invalido",
        })
        .expect(400);

    // Admin publica el borrador -> ahora UserA sí puede verlo
    await request(app)
        .patch(`/api/publicacion/${createdPublicacionId}/estado`)
        .set("Authorization", tokenAdmin)
        .send({ publicado: true })
        .expect(200);

    await request(app)
        .get(`/api/publicacion/${createdPublicacionId}`)
        .set("Authorization", tokenUserA)
        .expect(200);

    // UserA no puede inscribirse en una publicación de tipo 'noticia' (D-04) -> 400
    await request(app)
        .post(`/api/capacitaciones/${createdPublicacionId}/inscribirse`)
        .set("Authorization", tokenUserA)
        .expect(400);

    // CIT crea una capacitación pública y UserA se inscribe
    const capRes = await request(app)
        .post("/api/publicacion")
        .set("Authorization", tokenCIT)
        .send({
            titulo: `Jornada de Manejo Sanitario ${unique}`,
            contenido: "Capacitación técnica abierta a productores.",
            tipo_contenido: "capacitacion",
            sector: "GANADERO",
            publicado: true,
        })
        .expect(201);

    createdCapacitacionId = capRes.body.data.id;

    await request(app)
        .post(`/api/capacitaciones/${createdCapacitacionId}/inscribirse`)
        .set("Authorization", tokenUserA)
        .expect(201);

    // Evita doble inscripción a la misma capacitación (409)
    await request(app)
        .post(`/api/capacitaciones/${createdCapacitacionId}/inscribirse`)
        .set("Authorization", tokenUserA)
        .expect(409);
});

test("5. Propuestas y Solicitudes CIT: envío por 'user', protección de adjuntos y conversión en Servicio por 'cit'", async () => {
    // Personal CIT no puede usar el formulario de usuarios externos -> 403
    await request(app)
        .post("/api/propuestas")
        .set("Authorization", tokenCIT)
        .field("nombre_organismo", "CIT Interno")
        .field("email_contacto", "cit@cit.test")
        .field("telefono_contacto", "+54 370 4000000")
        .field("titulo", `Propuesta CIT ${unique}`)
        .field("sector", "AGRICOLA")
        .field("problematica", "Descripción de más de veinte caracteres para validación.")
        .field("bienes_recursos", "Laboratorio")
        .expect(403);

    // Propuesta sin datos completos del organismo o bienes/recursos es rechazada con 400 (D-05)
    await request(app)
        .post("/api/propuestas")
        .set("Authorization", tokenUserA)
        .field("titulo", `Propuesta Incompleta ${unique}`)
        .field("sector", "FRUTIHORTICOLA")
        .field(
            "problematica",
            "Descripción válida de más de veinte caracteres pero sin datos del organismo.",
        )
        .expect(400);

    // UserA presenta una propuesta con documento PDF válido -> 201
    const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const propRes = await request(app)
        .post("/api/propuestas")
        .set("Authorization", tokenUserA)
        .field("nombre_organismo", "Cooperativa Agrícola Formosa")
        .field("email_contacto", "coop@formosa.org")
        .field("telefono_contacto", "+54 370 4112233")
        .field("titulo", `Control Biológico en Horticultura ${unique}`)
        .field("sector", "FRUTIHORTICOLA")
        .field(
            "problematica",
            "Implementación de monitoreo y control biológico para productores frutihortícolas.",
        )
        .field("bienes_recursos", "Parcelas demostrativas y equipamiento de riego.")
        .attach("documento", pdfBuffer, "aval-cooperativa.pdf")
        .expect(201);

    createdPropuestaId = propRes.body.data.id;
    const documentoUrl: string = propRes.body.data.documento_url;
    assert.ok(documentoUrl.startsWith("/api/uploads/"));

    // UserB NO puede descargar el documento adjunto de la propuesta de UserA -> 403
    await request(app)
        .get(documentoUrl)
        .set("Authorization", tokenUserB)
        .expect(403);

    // UserA (autor) y CIT (revisor) SÍ pueden descargar el documento -> 200
    await request(app)
        .get(documentoUrl)
        .set("Authorization", tokenUserA)
        .expect(200);
    await request(app)
        .get(documentoUrl)
        .set("Authorization", tokenCIT)
        .expect(200);

    // UserA no puede tomar en revisión ni dictaminar propuestas -> 403
    await request(app)
        .patch(`/api/propuestas/${createdPropuestaId}/revision`)
        .set("Authorization", tokenUserA)
        .expect(403);

    // CIT toma la propuesta en revisión (PENDIENTE -> EN_REVISION)
    const revRes = await request(app)
        .patch(`/api/propuestas/${createdPropuestaId}/revision`)
        .set("Authorization", tokenCIT)
        .expect(200);
    assert.equal(revRes.body.data.Estado.codigo, "EN_REVISION");

    // CIT acepta la propuesta y la convierte automáticamente en Servicio con trazabilidad
    const dictRes = await request(app)
        .post(`/api/propuestas/dictaminar/${createdPropuestaId}`)
        .set("Authorization", tokenCIT)
        .send({
            decision: "ACEPTADA",
            justificacion:
                "Propuesta viable técnica y operativamente; se incorpora al catálogo oficial.",
            servicio_precio: 8500,
        })
        .expect(200);

    assert.ok(dictRes.body.data.servicio_generado_id > 0);
});

test("6. Seguridad de Perfil y Actividad Privada: bloqueo de escalamiento de rol y acceso cruzado", async () => {
    // UserB no puede leer ni modificar el perfil ni la actividad de UserA -> 403
    await request(app)
        .get(`/api/profile/${userA.id}`)
        .set("Authorization", tokenUserB)
        .expect(403);

    await request(app)
        .get(`/api/profile/${userA.id}/actividad`)
        .set("Authorization", tokenUserB)
        .expect(403);

    await request(app)
        .put(`/api/profile/${userA.id}`)
        .set("Authorization", tokenUserB)
        .send({ first_name: "Intruso" })
        .expect(403);

    // UserA actualiza su propio perfil e intenta inyectar role: "admin" -> el rol permanece "user"
    await request(app)
        .put(`/api/profile/${userA.id}`)
        .set("Authorization", tokenUserA)
        .send({
            first_name: "Ana María",
            last_name: "Productora",
            bio: "Productora agropecuaria de Formosa.",
            role: ROL.ADMIN,
            rol: ROL.ADMIN,
        })
        .expect(200);

    const meRes = await request(app)
        .get("/api/profile")
        .set("Authorization", tokenUserA)
        .expect(200);
    assert.equal(meRes.body.User?.role ?? meRes.body.role, ROL.USER);
    assert.equal(meRes.body.first_name, "Ana María");
    assert.equal(meRes.body.bio, "Productora agropecuaria de Formosa.");

    // UserA consulta su actividad consolidada (Mis Propuestas, Mis Servicios, Mis Capacitaciones)
    const actRes = await request(app)
        .get(`/api/profile/${userA.id}/actividad`)
        .set("Authorization", tokenUserA)
        .expect(200);
    assert.ok(actRes.body.data.propuestas.length >= 1);
    assert.ok(actRes.body.data.servicios.length >= 1);
    assert.ok(actRes.body.data.capacitaciones.length >= 1);
});
