import { useEffect, useMemo, useState } from 'react';
import { listenStudents, listenScoring, listenScoringHistorial, addScoringEntry, SCORE_START } from '../lib/data';
import { fmtDateTime } from '../lib/dates';
import { usePreceptor } from '../context/PreceptorContext';

const FILTERS = ['Todos', 'A', 'B', 'C'];
const CATEGORIES = ['ADVERTENCIA', 'LEVE', 'MODERADA', 'GRAVE'];

function colorFor(score) {
  if (score >= 20) return { fill: '#16a34a', text: '#166534' };
  if (score >= 10) return { fill: '#f59e0b', text: '#854d0e' };
  return { fill: '#dc2626', text: '#991b1b' };
}

export default function Scoring() {
  const [students, setStudents] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [openDni, setOpenDni] = useState(null);

  useEffect(() => listenStudents(setStudents, (e) => alert('Error: ' + e.message)), []);
  useEffect(() => listenScoring(setScoring, (e) => alert('Error: ' + e.message)), []);

  const sorted = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
  }, [students]);

  const scoreByDni = useMemo(() => {
    const m = {};
    (scoring || []).forEach((s) => (m[s.dni] = s));
    return m;
  }, [scoring]);

  const visible = useMemo(() => {
    return sorted.filter((s) => {
      if (filter !== 'Todos' && s.pabellon !== filter) return false;
      if (search && !s.nombreCompleto.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sorted, filter, search]);

  if (!students || !scoring) {
    return (
      <>
        <Header filter={filter} search={search} setSearch={setSearch} />
        <main className="app-main">
          <div className="loading">Cargando datos...</div>
        </main>
      </>
    );
  }

  const openStudent = openDni ? students.find((s) => s.dni === openDni) : null;

  return (
    <>
      <Header filter={filter} search={search} setSearch={setSearch} />
      <button className="fab" onClick={() => setFilter(FILTERS[(FILTERS.indexOf(filter) + 1) % FILTERS.length])}>
        {filter === 'Todos' ? 'Todos' : `Pab. ${filter}`}
      </button>
      <main className="app-main">
        <ul className="list">
          {visible.length === 0 && <li className="empty">Sin resultados</li>}
          {visible.map((s) => {
            const info = scoreByDni[s.dni] || { puntaje: SCORE_START };
            const pct = Math.max(0, Math.min(100, (info.puntaje / SCORE_START) * 100));
            const col = colorFor(info.puntaje);
            return (
              <li key={s.dni} className="row scoring" onClick={() => setOpenDni(s.dni)}>
                <div className="row-info">
                  <div className="row-name">{s.nombreCompleto}</div>
                  <div className="row-sub">
                    {s.curso} · Pab. {s.pabellon}
                  </div>
                </div>
                <div className="score-block">
                  <div className="score-num" style={{ color: col.text }}>
                    {info.puntaje}
                  </div>
                  <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{ width: pct + '%', background: col.fill }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      {openStudent && (
        <ScoreModal
          student={openStudent}
          info={scoreByDni[openStudent.dni] || { puntaje: SCORE_START }}
          onClose={() => setOpenDni(null)}
        />
      )}
    </>
  );
}

function Header({ filter, search, setSearch }) {
  return (
    <header className="app-header">
      <div className="top-row">
        <div>
          <h1>Scoring</h1>
          <p className="subtitle">{filter === 'Todos' ? 'Todos' : 'Pabellón ' + filter}</p>
        </div>
      </div>
      <div className="search-row">
        <input type="search" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </header>
  );
}

function ScoreModal({ student, info, onClose }) {
  const { nombre: preceptor } = usePreceptor();
  const [historial, setHistorial] = useState(null);
  const [cat, setCat] = useState(null);
  const [points, setPoints] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(
    () => listenScoringHistorial(student.dni, setHistorial, (e) => alert('Error: ' + e.message)),
    [student.dni]
  );

  const canSave = cat && (cat === 'ADVERTENCIA' || (points !== '' && !isNaN(Number(points)) && Number(points) >= 0));

  async function handleSave() {
    setSaving(true);
    try {
      await addScoringEntry(student.dni, student.nombreCompleto, cat, cat === 'ADVERTENCIA' ? 0 : Number(points), desc.trim(), preceptor);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{student.nombreCompleto}</h3>
        <p className="modal-score">
          Puntaje actual: {info.puntaje} / {SCORE_START} · {student.curso} · Pab. {student.pabellon}
        </p>

        <div className="field-label">Historial</div>
        <div className="hist-box">
          {!historial ? (
            <span className="hist-empty">Cargando...</span>
          ) : historial.length === 0 ? (
            <span className="hist-empty">Sin novedades registradas.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {historial.map((h) => {
                const fecha = h.timestamp?.toDate ? fmtDateTime(h.timestamp.toDate()) : '';
                return (
                  <div key={h.id}>
                    <strong>{fecha} · {h.categoria}</strong>
                    {h.puntos > 0 ? ` (-${h.puntos} pts)` : ' (0 pts)'}
                    {h.descripcion ? `: ${h.descripcion}` : ''}
                    {h.preceptor ? ` · ${h.preceptor}` : ''}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="field-label" style={{ marginTop: 14 }}>
          Nueva novedad
        </div>
        <div className="cat-btns">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`cat-btn${cat === c ? ' sel-' + c : ''}`}
              onClick={() => setCat(c)}
            >
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {cat && cat !== 'ADVERTENCIA' && (
          <div>
            <div className="field-label">Puntos a restar</div>
            <input type="number" min="0" step="1" placeholder="Ej: 2" value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
        )}

        <div className="field-label">Descripción</div>
        <textarea rows={3} placeholder="Ej: no respeta horario de descanso" value={desc} onChange={(e) => setDesc(e.target.value)} />

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!canSave || saving} onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
