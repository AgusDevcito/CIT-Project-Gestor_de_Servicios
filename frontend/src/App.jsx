import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import Home from './pages/Home';
import Servicios from './pages/Servicios';
import Solicitudes from './pages/Solicitudes';
import Publicaciones from './pages/Publicaciones';
import PublicacionDetalle from './pages/PublicacionDetalle';
import Propuestas from './pages/Propuestas';
import Perfil from './pages/Perfil';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="solicitudes" element={<Solicitudes />} />
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
