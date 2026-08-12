import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { PreceptorProvider } from './context/PreceptorContext';
import Login from './pages/Login';
import ResetPin from './pages/ResetPin';
import Inicio from './pages/Inicio';
import Asistencia from './pages/Asistencia';
import Scoring from './pages/Scoring';
import Alumnos from './pages/Alumnos';
import Reporte from './pages/Reporte';

// El link del mail "Olvide mi PIN" tiene que abrir siempre esta pantalla,
// este o no logueado quien lo toca.
function isResetLink() {
  return (window.location.hash || '').startsWith('#/reset');
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (isResetLink()) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/reset" element={<ResetPin />} />
          <Route path="*" element={<ResetPin />} />
        </Routes>
      </HashRouter>
    );
  }

  if (user === undefined) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <PreceptorProvider user={user}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/scoring" element={<Scoring />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/reporte" element={<Reporte />} />
          <Route path="/reset" element={<ResetPin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </PreceptorProvider>
  );
}
