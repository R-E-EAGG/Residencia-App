import { useEffect, useMemo, useState } from 'react';
import { listenStudents, appendEvento, clearAttendanceDay, listenAttendanceForDate, listenObservaciones, addObservacion } from '../lib/data';
import { todayStr, isWithinWindow, lastEventKind, eventosToText, phoneDigits, fmtDateTime } from '../lib/dates';
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
  const [obsCtx, setObsCtx] = useState(null);
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
      <div className="pill-row">
        {FILTERS.map((f) => (
          <button key={f} className={`pill-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'Todos' ? 'Todos' : `Pab. ${f}`}
          </button>
        ))}
      </div>
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
        <StudentInfoModal student={infoStudent} preceptor={preceptor} onClose={() => setInfoStudent(null)} />
      )}
    </>
  );
}

function StudentInfoModal({ student, preceptor, onClose }) {
  const [observaciones, setObservaciones] = useState(null);
  const [nuevaObs, setNuevaObs] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(
    () => listenObservaciones(student.dni, setObservaciones, (e) => alert('Error: ' + e.message)),
    [student.dni]
  );

  async function handleAddObs() {
    const texto = nuevaObs.trim();
    if (!texto) return;
    setSaving(true);
    try {
      await addObservacion(student.dni, texto, preceptor);
      setNuevaObs('');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <h3>{student.nombreCompleto}</h3>
        <dl>
          <dt>DNI</dt>
          <dd>{student.dni}</dd>
          <dt>Curso</dt>
          <dd>{student.curso}</dd>
          <dt>Pabellón</dt>
          <dd>{student.pabellon}</dd>
          <dt>Tel. tutor</dt>
          <dd><PhoneLink text={student.telefonoTutor} /></dd>
          <dt>Tel. tutor local</dt>
          <dd><PhoneLink text={student.telefonoTutorLocal} /></dd>
        </dl>

        <div className="field-label">Observaciones</div>
        <div className="hist-box">
          {!observaciones ? (
            <span className="hist-empty">Cargando...</span>
          ) : observaciones.length === 0 ? (
            <span className="hist-empty">Sin observaciones cargadas.</span>
          ) : (
            observaciones
              .map((o) => {
                const fecha = o.timestamp?.toDate ? fmtDateTime(o.timestamp.toDate()) : '';
                const quien = o.preceptor ? ` · ${o.preceptor}` : '';
                return `${fecha}${quien}: ${o.texto}`;
              })
              .join('\n')
          )}
        </div>

        <div className="field-label" style={{ marginTop: 14 }}>
          Agregar observación
        </div>
        <textarea rows={3} value={nuevaObs} onChange={(e) => setNuevaObs(e.target.value)} placeholder="Escribí una observación..." />

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn-primary" disabled={!nuevaObs.trim() || saving} onClick={handleAddObs}>
            {saving ? 'Guardando...' : 'Guardar observación'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneLink({ text }) {
  const digits = phoneDigits(text);
  if (!digits) return <span style={{ color: '#b3adc6' }}>—</span>;
  return (
    <a
      href={`tel:${digits}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary-bg)',
        color: 'var(--primary-dark)', fontSize: 16, fontWeight: 600, padding: '8px 16px',
        borderRadius: 24, textDecoration: 'none',
      }}
    >
      <i className="ti ti-phone" style={{ fontSize: 17 }} aria-hidden="true" />
      {text}
    </a>
  );
}

function Header({ date, setDate, filter, counts, enabled, isToday }) {
  return (
    <header className="app-header">
      <div className="top-row">
        <div>
          <h1>Asistencia</h1>
          <p className="subtitle">{filter === 'Todos' ? 'Todos' : 'Pabellón ' + filter}</p>
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
