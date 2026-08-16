import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { usePreceptor } from '../context/PreceptorContext';

export default function Inicio() {
  const { nombre } = usePreceptor();

  return (
    <>
      <div className="home-header">
        <p className="home-eyebrow">{nombre ? `Hola, ${nombre}` : '\u00a0'}</p>
        <h1 className="home-title">Residencia Estudiantil - EAGG</h1>
      </div>

      <div className="home-grid">
        <Link className="home-tile accent" to="/asistencia">
          <i className="ti ti-clipboard-check tile-icon" aria-hidden="true" />
          <div className="home-tile-title">Asistencia</div>
          <div className="home-tile-desc">Ausentes, retiros e ingresos</div>
        </Link>

        <Link className="home-tile success" to="/scoring">
          <i className="ti ti-star tile-icon" aria-hidden="true" />
          <div className="home-tile-title">Scoring</div>
          <div className="home-tile-desc">Puntaje y novedades</div>
        </Link>

        <Link className="home-tile neutral" to="/alumnos">
          <i className="ti ti-user-plus tile-icon" aria-hidden="true" />
          <div className="home-tile-title">Alumnos</div>
          <div className="home-tile-desc">Cargar o editar</div>
        </Link>

        <Link className="home-tile neutral" to="/reporte">
          <i className="ti ti-printer tile-icon" aria-hidden="true" />
          <div className="home-tile-title">Reporte</div>
          <div className="home-tile-desc">Planilla mensual</div>
        </Link>
      </div>

      <div className="home-footer">
        <button className="home-logout" onClick={() => signOut(auth)}>
          Salir
        </button>
      </div>
    </>
  );
}
