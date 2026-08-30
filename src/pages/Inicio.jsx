import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { usePreceptor } from '../context/PreceptorContext';
import { listenStudents, listenScoringToday } from '../lib/data';
import { fmtDateTime } from '../lib/dates';

function todayLong() {
  const d = new Date();
  const str = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function Inicio() {
  const { nombre } = usePreceptor();
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);
  const [novedades, setNovedades] = useState([]);
  const [novedadIndex, setNovedadIndex] = useState(0);
  const [showNovedades, setShowNovedades] = useState(false);

  useEffect(() => listenStudents(setStudents, () => {}), []);
  useEffect(
    () => listenScoringToday(setNovedades, (err) => console.error('Error novedades scoring:', err)),
    []
  );

  const dniToStudent = useMemo(() => {
    const map = {};
    (students || []).forEach((s) => (map[s.dni] = s));
    return map;
  }, [students]);

  const hasNovedad = novedades.length > 0;

  function openScoring(e) {
    if (hasNovedad) {
      e.preventDefault();
      setNovedadIndex(0);
      setShowNovedades(true);
    }
  }

  function closeNovedades() {
    setShowNovedades(false);
  }

  function goToScoring() {
    setShowNovedades(false);
    navigate('/scoring');
  }

  const actual = novedades[novedadIndex];
  const actualStudent = actual ? dniToStudent[actual.dni] : null;

  return (
    <>
      <div className="home-header">
        <p className="home-eyebrow">{nombre ? `Hola, ${nombre}` : '\u00a0'}</p>
        <h1 className="home-title">Residencia Estudiantil - EAGG</h1>
        <p className="home-date">{todayLong()}</p>
      </div>

      <div className="home-grid">
        <Link className="home-tile accent" to="/asistencia">
          <div className="home-tile-icon-wrap">
            <i className="ti ti-clipboard-check tile-icon" aria-hidden="true" />
          </div>
          <div className="home-tile-title">Asistencia</div>
          <div className="home-tile-desc">Ausentes, retiros e ingresos</div>
        </Link>

        <Link className={`home-tile success${hasNovedad ? ' has-novedad' : ''}`} to="/scoring" onClick={openScoring}>
          <div className="home-tile-icon-wrap">
            <i className="ti ti-star tile-icon" aria-hidden="true" />
          </div>
          <div className="home-tile-title">Scoring</div>
          <div className="home-tile-desc">
            {hasNovedad ? `${novedades.length} novedad(es) hoy` : 'Puntaje y novedades'}
          </div>
        </Link>

        <Link className="home-tile neutral" to="/alumnos">
          <div className="home-tile-icon-wrap">
            <i className="ti ti-user-plus tile-icon" aria-hidden="true" />
          </div>
          <div className="home-tile-title">Alumnos</div>
          <div className="home-tile-desc">Cargar o editar</div>
        </Link>

        <Link className="home-tile neutral" to="/reporte">
          <div className="home-tile-icon-wrap">
            <i className="ti ti-printer tile-icon" aria-hidden="true" />
          </div>
          <div className="home-tile-title">Reporte</div>
          <div className="home-tile-desc">Planilla mensual</div>
        </Link>

        <Link className="home-tile neutral" to="/contactos" style={{ gridColumn: '1 / -1' }}>
          <div className="home-tile-icon-wrap">
            <i className="ti ti-phone-call tile-icon" aria-hidden="true" />
          </div>
          <div className="home-tile-title">Contactos</div>
          <div className="home-tile-desc">Teléfonos útiles y de emergencia</div>
        </Link>
      </div>

      <div className="home-footer">
        <button className="home-logout" onClick={() => signOut(auth)}>
          Salir
        </button>
      </div>

      {showNovedades && actual && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Novedad de scoring {novedades.length > 1 ? `(${novedadIndex + 1} de ${novedades.length})` : ''}</h3>
            <p className="modal-score">
              {actualStudent ? actualStudent.nombreCompleto : actual.dni}
              {actualStudent ? ` · ${actualStudent.curso} · Pab. ${actualStudent.pabellon}` : ''}
            </p>
            <dl>
              <dt>Categoría</dt>
              <dd style={{ fontWeight: 700 }}>{actual.categoria}</dd>
              <dt>Hora</dt>
              <dd style={{ fontWeight: 700 }}>{actual.timestamp?.toDate ? fmtDateTime(actual.timestamp.toDate()) : ''}</dd>
              <dt>Puntos</dt>
              <dd>{actual.puntos > 0 ? `-${actual.puntos}` : '0'}</dd>
              <dt>Descripción</dt>
              <dd>{actual.descripcion || '—'}</dd>
              <dt>Preceptor</dt>
              <dd>{actual.preceptor || '—'}</dd>
            </dl>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeNovedades}>
                Cerrar
              </button>
              {novedadIndex < novedades.length - 1 ? (
                <button className="btn btn-primary" onClick={() => setNovedadIndex((i) => i + 1)}>
                  Siguiente
                </button>
              ) : (
                <button className="btn btn-primary" onClick={goToScoring}>
                  Ir a Scoring
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
