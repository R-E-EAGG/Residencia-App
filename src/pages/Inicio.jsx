import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { usePreceptor } from '../context/PreceptorContext';

export default function Inicio() {
  const { nombre } = usePreceptor();

  return (
    <div className="home-wrap">
      <div className="home-inner">
        <h1>Residencia Estudiantil</h1>
        <p className="sub">{nombre ? `Hola, ${nombre}` : 'Elegi que queres hacer'}</p>

        <Link className="home-card" to="/asistencia">
          <div className="home-icon icon-asistencia">📋</div>
          <div className="home-card-text">
            <div className="home-card-title">Tomar Asistencia</div>
            <div className="home-card-desc">Ausentes, retiros e ingresos del dia</div>
          </div>
        </Link>

        <Link className="home-card" to="/scoring">
          <div className="home-icon icon-scoring">⭐</div>
          <div className="home-card-text">
            <div className="home-card-title">Scoring</div>
            <div className="home-card-desc">Puntaje y novedades de conducta</div>
          </div>
        </Link>

        <Link className="home-card" to="/alumnos">
          <div className="home-icon icon-asistencia" style={{ background: '#0891b2' }}>➕</div>
          <div className="home-card-text">
            <div className="home-card-title">Nuevo alumno</div>
            <div className="home-card-desc">Carga rapida al listado maestro</div>
          </div>
        </Link>

        <Link className="home-card" to="/reporte">
          <div className="home-icon icon-asistencia" style={{ background: '#7c3aed' }}>🖨️</div>
          <div className="home-card-text">
            <div className="home-card-title">Reporte mensual</div>
            <div className="home-card-desc">Planilla y detalle, para imprimir o PDF</div>
          </div>
        </Link>

        <button className="home-logout" onClick={() => signOut(auth)}>
          Salir
        </button>
      </div>
    </div>
  );
}
