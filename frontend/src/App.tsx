import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import Home from "./pages/Home";
import Servicios from "./pages/Servicios";
import ServicioDetalle from "./pages/ServicioDetalle";
import Capacitaciones from "./pages/Capacitaciones";
import MisServicios from "./pages/MisServicios";
import Solicitudes from "./pages/Solicitudes";
import Publicaciones from "./pages/Publicaciones";
import PublicacionDetalle from "./pages/PublicacionDetalle";
import Propuestas from "./pages/Propuestas";
import Ajustes from "./pages/Ajustes";
import Notificaciones from "./pages/Notificaciones";
import Perfil from "./pages/Perfil";

function App() {
  return (
    <Routes>
      {/* Rutas públicas: si ya hay sesión, redirigen a la home. */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Árbol principal con Layout: permite navegación pública en Home, Servicios, Capacitaciones y Publicaciones */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="servicios/:id" element={<ServicioDetalle />} />
        <Route path="capacitaciones" element={<Capacitaciones />} />
        <Route path="publicaciones" element={<Publicaciones />} />
        <Route path="publicaciones/:id" element={<PublicacionDetalle />} />

        {/* Rutas que exigen sesión iniciada */}
        <Route element={<ProtectedRoute />}>
          <Route path="mis-servicios" element={<MisServicios />} />
          <Route path="proponer" element={<Propuestas />} />
          <Route path="propuestas" element={<Navigate to="/proponer" replace />} />
          <Route path="notificaciones" element={<Notificaciones />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="ajustes/:seccion" element={<Ajustes />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* Apartado interno exclusivo para personal CIT y Administradores */}
        <Route element={<ProtectedRoute roles={["cit", "admin"]} />}>
          <Route path="solicitudes" element={<Solicitudes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
