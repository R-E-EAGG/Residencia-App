import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listenStudents, appendEvento, clearAttendanceDay, listenAttendanceForDate } from '../lib/data';
import { todayStr, isWithinWindow, lastEventKind, eventosToText } from '../lib/dates';
import { usePreceptor } from '../context/PreceptorContext';

const FILTERS = ['Todos', 'A', 'B', 'C'];

export default function Asistencia() {
  const { nombre: preceptor } = usePreceptor();
  const [students, setStudents] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [attendance, setAttendance] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [pending, setPending] = useState({});
  const [infoStudent, setInfoStudent] = useState(null);
  const [obsCtx, setObsCtx] = useState(null); // { student, kind }
  const [obsText, setObsText] = useState('');

  useEffect(() => {
    const unsub = listenStudents(setStudents, (err) => alert('Error: ' + err.message));
    return unsub;
  }, []);

  useEffect(() => {
    setAttendance(null);
    const unsub = listenAttendanceForDate(date, setAttendance, (err) => alert('Error: ' + err.message));
    return unsub;
  }, [date]);

  const isToday = date === todayStr();
  const enabled = !isToday || isWithinWindow();

  const sorted = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
  }, [students]);

  const visible = useMemo(
    () => (filter === 'Todos' ? sorted : sorted.filter((s) => s.pabellon === filter)),
    [sorted, filter]
  );

  const counts = useMemo(() => {
    const c = { P: 0, A: 0, R: 0, I: 0 };
    if (!attendance) return c;
    visible.forEach((s) => {
      const kind = lastEventKind(attendance[s.dni]?.eventos);
      if (kind === 'AUSENTE') c.A++;
      else if (kind === 'RETIRO') c.R++;
      else if (kind === 'REGRESO') c.I++;
    });
    c.P = Math.max(0, visible.length - c.A - c.R);
    return c;
  }, [visible, attendance]);

  function setPendingFor(dni, val) {
    setPending((p) => {
      const next = { ...p };
      if (val) next[dni] = true;
      else delete next[dni];
      return next;
    });
  }

  async function doAppendEvent(dni, tipo, detalle) {
    setPendingFor(dni, true);
    try {
      await appendEvento(dni, date, tipo, detalle, preceptor);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setPendingFor(dni, false);
    }
  }

  async function doClear(dni) {
    if (!confirm('¿Borrar la novedad de este alumno para este día?')) return;
    setPendingFor(dni, true);
    try {
      await clearAttendanceDay(dni, date);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setPendingFor(dni, false);
    }
  }

  function openObs(s, kind) {
    setObsText('');
    setObsCtx({ student: s, kind });
  }

  function saveObs() {
    if (!obsCtx) return;
    const { student, kind } = obsCtx;
    setObsCtx(null);
    doAppendEvent(student.dni, kind, obsText.trim());
  }

  if (!students || !attendance) {
    return (
      <>
        <Header date={date} setDate={setDate} filter={filter} />
        <main className="app-main">
          <div className="loading">Cargando datos...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header date={date} setDate={setDate} filter={filter} counts={counts} enabled={enabled} isToday={isToday} />
      <main className="app-main">
        <ul className="list">
          {visible.map((s) => {
            const eventos = attendance[s.dni]?.eventos;
            const kind = lastEventKind(eventos);
            const text = eventosToText(eventos);
            const isPending = !!pending[s.dni];
            return (
              <li key={s.dni} className={`row${kind ? ' st-' + kind : ''}`}>
                <button className="row-info" onClick={() => setInfoStudent(s)}>
                  <div className="row-name">{s.nombreCompleto}</div>
                  <div className="row-sub">
                    {s.curso} · Pab. {s.pabellon}
                    {text ? '\n' + text : ''}
                  </div>
                </button>
                <div className="row-actions">
                  {isPending && <span className="spinner" />}
                  <button
                    className={`status-btn${kind === 'AUSENTE' ? ' active-A' : ''}`}
                    disabled={!enabled || isPending}
                    onClick={() => doAppendEvent(s.dni, 'AUSENTE')}
                  >
                    A
                  </button>
                  <button
                    className={`status-btn${kind === 'RETIRO' ? ' active-R' : ''}`}
                    disabled={!enabled || isPending}
                    onClick={() => openObs(s, 'RETIRO')}
                  >
                    R
                  </button>
                  <button
                    className={`status-btn${kind === 'REGRESO' ? ' active-I' : ''}`}
                    disabled={!enabled || isPending}
                    onClick={() => openObs(s, 'REGRESO')}
                  >
                    I
                  </button>
                  <button
                    className="eraser-btn"
                    disabled={!text || !enabled || isPending}
                    onClick={() => doClear(s.dni)}
                  >
                    ⌫
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      <FilterFab filter={filter} setFilter={setFilter} />

      {obsCtx && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {(obsCtx.kind === 'RETIRO' ? 'Se retira' : 'Ingresa / Regresa')} — {obsCtx.student.nombreCompleto}
            </h3>
            <p className="hint">
              Ej.: "va al médico, salida 18 hs" · al regresar: "regresa 20 hs, todo bien". Se agrega como línea
              nueva, sin borrar lo anterior.
            </p>
            <textarea rows={4} value={obsText} onChange={(e) => setObsText(e.target.value)} placeholder="Novedad..." />
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setObsCtx(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={saveObs}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {infoStudent && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{infoStudent.nombreCompleto}</h3>
            <dl>
              <dt>DNI</dt>
              <dd>{infoStudent.dni}</dd>
              <dt>Curso</dt>
              <dd>{infoStudent.curso}</dd>
              <dt>Pabellón</dt>
              <dd>{infoStudent.pabellon}</dd>
              <dt>Tel. tutor</dt>
              <dd>{infoStudent.telefonoTutor}</dd>
              <dt>Tel. tutor local</dt>
              <dd>{infoStudent.telefonoTutorLocal}</dd>
            </dl>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setInfoStudent(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Header({ date, setDate, filter, counts, enabled, isToday }) {
  return (
    <header className="app-header">
      <Link className="back-link" to="/">
        ← Inicio
      </Link>
      <div className="top-row">
        <div>
          <h1>Asistencia</h1>
          <p className="subtitle">Residencia · {filter === 'Todos' ? 'Todos' : 'Pabellón ' + filter}</p>
        </div>
        <div className="top-right">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="save-status">
            <span className="dot" />
            <span>En vivo</span>
          </div>
        </div>
      </div>
      {counts && (
        <div className="counts">
          <div className="counter c-p">
            <div className="val">{counts.P}</div>
            <div className="lbl">Pres.</div>
          </div>
          <div className="counter c-a">
            <div className="val">{counts.A}</div>
            <div className="lbl">Aus.</div>
          </div>
          <div className="counter c-r">
            <div className="val">{counts.R}</div>
            <div className="lbl">Retir.</div>
          </div>
          <div className="counter c-i">
            <div className="val">{counts.I}</div>
            <div className="lbl">Ingr.</div>
          </div>
        </div>
      )}
      {isToday && !enabled && <div className="warning">Asistencia deshabilitada. Horario: 13:00 a 08:00 hs.</div>}
    </header>
  );
}

function FilterFab({ filter, setFilter }) {
  return (
    <button
      className="fab"
      onClick={() => setFilter(FILTERS[(FILTERS.indexOf(filter) + 1) % FILTERS.length])}
    >
      ⚓ {filter === 'Todos' ? 'Todos' : 'Pab. ' + filter}
    </button>
  );
}
