import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listenStudents, getAttendanceForMonth } from '../lib/data';

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
  const [students, setStudents] = useState(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [pabellon, setPabellon] = useState('Todos');
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => listenStudents(setStudents, (e) => alert('Error: ' + e.message)), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAttendanceForMonth(month)
      .then((data) => {
        if (active) setAttendance(data);
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

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .app-main { padding: 0 !important; max-width: none !important; }
          body { background: #fff !important; }
        }
        .rep-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .rep-table th, .rep-table td { border: 1px solid #e2e8f0; padding: 3px 4px; text-align: center; }
        .rep-table td.name { text-align: left; white-space: nowrap; }
        .rep-table th.name { text-align: left; }
        .code-A { background: #fee2e2; color: #991b1b; font-weight: 700; }
        .code-R { background: #ffedd5; color: #9a3412; font-weight: 700; }
        .code-I { background: #dcfce7; color: #166534; font-weight: 700; }
      `}</style>

      <header className="app-header no-print">
        <Link className="back-link" to="/">
          ← Inicio
        </Link>
        <div className="top-row">
          <div>
            <h1>Reporte mensual</h1>
            <p className="subtitle">Planilla de asistencia y detalle de movimientos</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
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
      </header>

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
          </>
        )}
      </main>
    </>
  );
}
