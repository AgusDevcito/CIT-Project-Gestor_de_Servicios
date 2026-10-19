import logoCitio from "../assets/logo-CITio.png";
import { useAuth } from "../context/useAuth";

export default function Home() {
  const { user } = useAuth();
  const displayName = user?.nombre || user?.username;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-cit-600/40 bg-cit-800 p-8 text-center">
        <img src={logoCitio} alt="Logo CITio" className="mx-auto h-24 w-24 object-contain" />
        <h1 className="mt-6 text-3xl font-bold text-white">
          {displayName ? (
            <>
              Hola, <span className="text-cit-neon">{displayName}</span>
            </>
          ) : (
            "Bienvenido a CITio"
          )}
        </h1>
        <p className="mt-3 text-slate-300">
          Gestor de Servicios del Centro de Investigación y Transacciones de Formosa.
        </p>
      </div>
    </div>
  );
}
