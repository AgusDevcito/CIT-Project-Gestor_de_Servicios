import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import Home from "./pages/Home";
import Servicios from "./pages/Servicios";
import ServicioDetalle from "./pages/ServicioDetalle";
import Solicitudes from "./pages/Solicitudes";
import Publicaciones from "./pages/Publicaciones";
import PublicacionDetalle from "./pages/PublicacionDetalle";
import Propuestas from "./pages/Propuestas";
import Perfil from "./pages/Perfil";

function App() {
  return (
    <Routes>
      {/* Rutas públicas: si ya hay sesión, redirigen a la home. */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Árbol privado: exige sesión. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="servicios/:id" element={<ServicioDetalle />} />

          {/* Apartado interno exclusivo para personal CIT y Administradores */}
          <Route element={<ProtectedRoute roles={["cit", "admin"]} />}>
            <Route path="solicitudes" element={<Solicitudes />} />
          </Route>

          <Route path="publicaciones" element={<Publicaciones />} />
          <Route path="publicaciones/:id" element={<PublicacionDetalle />} />
          <Route path="propuestas" element={<Propuestas />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
