import { useEffect, useMemo, useState } from 'react';
import { listenStudents, getAttendanceForMonth, getScoringForMonth, listenScoringHistorial, listenScoring, SCORE_START } from '../lib/data';
import { fmtDateTime } from '../lib/dates';

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function daysInMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function kindLetter(tipo) {
  if (tipo === 'AUSENTE') return 'A';
  if (tipo === 'RETIRO') return 'R';
  if (tipo === 'REGRESO') return 'I';
  return '';
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function Reporte() {
  const [view, setView] = useState('mensual');
  const [students, setStudents] = useState(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [pabellon, setPabellon] = useState('Todos');
  const [attendance, setAttendance] = useState(null);
  const [scoringMonth, setScoringMonth] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => listenStudents(setStudents, (e) => alert('Error: ' + e.message)), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getAttendanceForMonth(month), getScoringForMonth(month)])
      .then(([asis, scoring]) => {
        if (active) {
          setAttendance(asis);
          setScoringMonth(scoring);
        }
      })
      .catch((e) => alert('Error: ' + e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [month]);

  const visible = useMemo(() => {
    if (!students) return [];
    return students
      .filter((s) => pabellon === 'Todos' || s.pabellon === pabellon)
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
  }, [students, pabellon]);

  const nDays = daysInMonth(month);
  const dayNums = Array.from({ length: nDays }, (_, i) => i + 1);
  const [y, m] = month.split('-').map(Number);
  const tituloMes = `${MESES[m - 1]} ${y}`;

  const detalle = useMemo(() => {
    if (!attendance || !students) return [];
    const rows = [];
    visible.forEach((s) => {
      const porDia = attendance[s.dni] || {};
      Object.keys(porDia)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((dia) => {
          (porDia[dia].eventos || []).forEach((ev) => {
            rows.push({
              alumno: s.nombreCompleto,
              fecha: `${pad(dia)}/${pad(m)}/${y}`,
              hora: ev.hora,
              tipo: ev.tipo,
              detalle: ev.detalle,
              preceptor: ev.preceptor,
            });
          });
        });
    });
    return rows;
  }, [attendance, students, visible, m, y]);

  const dniToName = useMemo(() => {
    const map = {};
    (students || []).forEach((s) => (map[s.dni] = { nombre: s.nombreCompleto, pabellon: s.pabellon }));
    return map;
  }, [students]);

  const detalleScoring = useMemo(() => {
    if (!scoringMonth) return [];
    return scoringMonth
      .filter((r) => {
        const info = dniToName[r.dni];
        if (!info) return false;
        return pabellon === 'Todos' || info.pabellon === pabellon;
      })
      .map((r) => {
        const fechaObj = r.timestamp?.toDate ? r.timestamp.toDate() : null;
        return {
          alumno: dniToName[r.dni]?.nombre || r.dni,
          fecha: fechaObj ? fechaObj.toLocaleDateString('es-AR') : '',
          hora: fechaObj ? fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
          categoria: r.categoria,
          puntos: r.puntos,
          descripcion: r.descripcion,
          preceptor: r.preceptor,
        };
      });
  }, [scoringMonth, dniToName, pabellon]);

  return (
    <>
      <header className="app-header no-print">
        <div className="top-row">
          <div>
            <h1>Reporte</h1>
            <p className="subtitle">Planilla mensual y detalle de movimientos</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`pill-btn${view === 'mensual' ? ' active' : ''}`} onClick={() => setView('mensual')}>
            Reporte mensual
          </button>
          <button className={`pill-btn${view === 'individual' ? ' active' : ''}`} onClick={() => setView('individual')}>
            Historial por alumno
          </button>
        </div>
      </header>

      {view === 'individual' ? (
        <ReporteIndividual students={students} />
      ) : (
        <ReporteMensual
          month={month}
          setMonth={setMonth}
          pabellon={pabellon}
          setPabellon={setPabellon}
          loading={loading}
          students={students}
          visible={visible}
          dayNums={dayNums}
          tituloMes={tituloMes}
          attendance={attendance}
          detalle={detalle}
          detalleScoring={detalleScoring}
        />
      )}
    </>
  );
}

function ReporteMensual({ month, setMonth, pabellon, setPabellon, loading, students, visible, dayNums, tituloMes, attendance, detalle, detalleScoring }) {
  return (
    <>
      <div className="app-header no-print" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <select value={pabellon} onChange={(e) => setPabellon(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', fontSize: 13 }}>
            <option>Todos</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Descargar / imprimir PDF
          </button>
        </div>
      </div>

      <main className="app-main">
        {loading || !students ? (
          <div className="loading">Cargando...</div>
        ) : (
          <>
            <h2 style={{ fontSize: 14, textTransform: 'capitalize' }}>
              {tituloMes} · {pabellon === 'Todos' ? 'Todos los pabellones' : 'Pabellón ' + pabellon}
            </h2>

            <div style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table className="rep-table">
                <thead>
                  <tr>
                    <th className="name">Alumno</th>
                    {dayNums.map((d) => (
                      <th key={d}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => {
                    const porDia = attendance[s.dni] || {};
                    return (
                      <tr key={s.dni}>
                        <td className="name">{s.nombreCompleto}</td>
                        {dayNums.map((d) => {
                          const eventos = porDia[d]?.eventos || [];
                          const last = eventos[eventos.length - 1];
                          const letra = last ? kindLetter(last.tipo) : '';
                          return (
                            <td key={d} className={letra ? 'code-' + letra : ''}>
                              {letra}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h2 style={{ fontSize: 14 }}>Detalle de movimientos</h2>
            {detalle.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted-text)' }}>Sin movimientos registrados este mes.</p>
            ) : (
              <table className="rep-table">
                <thead>
                  <tr>
                    <th className="name">Alumno</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th className="name">Detalle</th>
                    <th className="name">Preceptor</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map((r, i) => (
                    <tr key={i}>
                      <td className="name">{r.alumno}</td>
                      <td>{r.fecha}</td>
                      <td>{r.hora}</td>
                      <td>{r.tipo}</td>
                      <td className="name">{r.detalle}</td>
                      <td className="name">{r.preceptor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h2 style={{ fontSize: 14, marginTop: 24 }}>Detalle de scoring</h2>
            {detalleScoring.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted-text)' }}>Sin novedades de scoring registradas este mes.</p>
            ) : (
              <table className="rep-table">
                <thead>
                  <tr>
                    <th className="name">Alumno</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Categoría</th>
                    <th>Puntos</th>
                    <th className="name">Descripción</th>
                    <th className="name">Preceptor</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleScoring.map((r, i) => (
                    <tr key={i}>
                      <td className="name">{r.alumno}</td>
                      <td style={{ fontWeight: 700 }}>{r.fecha}</td>
                      <td style={{ fontWeight: 700 }}>{r.hora}</td>
                      <td style={{ fontWeight: 700 }}>{r.categoria}</td>
                      <td>{r.puntos > 0 ? `-${r.puntos}` : '0'}</td>
                      <td className="name">{r.descripcion}</td>
                      <td className="name">{r.preceptor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </>
  );
}

function ReporteIndividual({ students }) {
  const [search, setSearch] = useState('');
  const [selectedDni, setSelectedDni] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [scoring, setScoring] = useState(null);

  useEffect(() => (selectedDni ? listenScoringHistorial(selectedDni, setHistorial, (e) => alert('Error: ' + e.message)) : undefined), [selectedDni]);
  useEffect(() => listenScoring(setScoring, (e) => alert('Error: ' + e.message)), []);

  const matches = useMemo(() => {
    if (!students || !search.trim()) return [];
    const q = search.toLowerCase();
    return students
      .filter((s) => s.nombreCompleto.toLowerCase().includes(q) || s.dni.includes(q))
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
      .slice(0, 8);
  }, [students, search]);

  const selected = selectedDni ? students?.find((s) => s.dni === selectedDni) : null;
  const puntajeActual = scoring?.find((s) => s.dni === selectedDni)?.puntaje ?? SCORE_START;

  return (
    <>
      <div className="app-header no-print" style={{ paddingTop: 0 }}>
        {!selected ? (
          <div className="search-row">
            <input type="search" placeholder="Buscar alumno por nombre o DNI..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => { setSelectedDni(null); setHistorial(null); setSearch(''); }}>
              Cambiar alumno
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              Descargar / imprimir PDF
            </button>
          </div>
        )}
      </div>

      <main className="app-main">
        {!selected ? (
          matches.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted-text)', padding: '0 4px' }}>
              {search.trim() ? 'Sin resultados.' : 'Escribí un nombre o DNI para buscar.'}
            </p>
          ) : (
            <ul className="list">
              {matches.map((s) => (
                <li key={s.dni} className="row" style={{ cursor: 'pointer' }} onClick={() => setSelectedDni(s.dni)}>
                  <div className="row-info">
                    <div className="row-name">{s.nombreCompleto}</div>
                    <div className="row-sub">
                      DNI {s.dni} · {s.curso} · Pab. {s.pabellon}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 2 }}>{selected.nombreCompleto}</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-text)', margin: '0 0 4px' }}>
              DNI {selected.dni} · {selected.curso} · Pabellón {selected.pabellon}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 16px' }}>Puntaje actual: {puntajeActual} / {SCORE_START}</p>

            {!historial ? (
              <div className="loading">Cargando historial...</div>
            ) : historial.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted-text)' }}>Sin novedades de scoring registradas.</p>
            ) : (
              <table className="rep-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Puntos</th>
                    <th className="name">Descripción</th>
                    <th className="name">Preceptor</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => {
                    const fecha = h.timestamp?.toDate ? fmtDateTime(h.timestamp.toDate()) : '';
                    return (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700 }}>{fecha}</td>
                        <td style={{ fontWeight: 700 }}>{h.categoria}</td>
                        <td>{h.puntos > 0 ? `-${h.puntos}` : '0'}</td>
                        <td className="name">{h.descripcion}</td>
                        <td className="name">{h.preceptor}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </>
  );
}
