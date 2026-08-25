import { useEffect, useMemo, useState } from 'react';
import { listenStudents, addStudent, editStudent } from '../lib/data';

const EMPTY = { dni: '', nombreCompleto: '', curso: '', pabellon: '', telefonoTutor: '', telefonoTutorLocal: '' };

export default function Alumnos() {
  const [students, setStudents] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingDni, setEditingDni] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => listenStudents(setStudents, (e) => alert('Error: ' + e.message)), []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const canSave = form.dni.trim() && form.nombreCompleto.trim() && form.curso.trim() && form.pabellon.trim();

  const visible = useMemo(() => {
    if (!students) return [];
    return [...students]
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
      .filter((s) => !search || s.nombreCompleto.toLowerCase().includes(search.toLowerCase()) || s.dni.includes(search));
  }, [students, search]);

  function startEdit(s) {
    setEditingDni(s.dni);
    setForm({
      dni: s.dni,
      nombreCompleto: s.nombreCompleto,
      curso: s.curso,
      pabellon: s.pabellon,
      telefonoTutor: s.telefonoTutor || '',
      telefonoTutorLocal: s.telefonoTutorLocal || '',
    });
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingDni(null);
    setForm(EMPTY);
    setMsg('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const data = {
      dni: form.dni.trim(),
      nombreCompleto: form.nombreCompleto.trim(),
      curso: form.curso.trim(),
      pabellon: form.pabellon.trim().toUpperCase(),
      telefonoTutor: form.telefonoTutor.trim(),
      telefonoTutorLocal: form.telefonoTutorLocal.trim(),
    };
    try {
      if (editingDni) {
        await editStudent(editingDni, data);
        setMsg(`Datos de "${data.nombreCompleto}" actualizados.`);
        setEditingDni(null);
      } else {
        await addStudent(data);
        setMsg(`Alumno "${data.nombreCompleto}" cargado.`);
      }
      setForm(EMPTY);
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="top-row">
          <div>
            <h1>{editingDni ? 'Editar alumno' : 'Nuevo alumno'}</h1>
            <p className="subtitle">{editingDni ? `Corrigiendo DNI original ${editingDni}` : 'Carga rápida al listado maestro'}</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <Field label="DNI" value={form.dni} onChange={(v) => set('dni', v)} />
          <Field label="Apellido y nombre" value={form.nombreCompleto} onChange={(v) => set('nombreCompleto', v)} />
          <Field label="Curso" value={form.curso} onChange={(v) => set('curso', v)} placeholder="Ej: 4to B" />
          <Field label="Pabellón" value={form.pabellon} onChange={(v) => set('pabellon', v)} placeholder="Ej: A" />
          <Field label="Teléfono tutor" value={form.telefonoTutor} onChange={(v) => set('telefonoTutor', v)} required={false} />
          <Field label="Teléfono tutor local" value={form.telefonoTutorLocal} onChange={(v) => set('telefonoTutorLocal', v)} required={false} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={!canSave || saving} style={{ flex: 1 }}>
              {saving ? 'Guardando...' : editingDni ? 'Guardar cambios' : 'Guardar alumno'}
            </button>
            {editingDni && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--red-text)' : 'var(--green-text)' }}>{msg}</div>}
        </form>

        <div className="search-row">
          <input type="search" placeholder="Buscar alumno por nombre o DNI..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {!students ? (
          <div className="loading">Cargando...</div>
        ) : (
          <ul className="list">
            {visible.length === 0 && <li className="empty">Sin resultados</li>}
            {visible.map((s) => (
              <li key={s.dni} className="row" style={{ cursor: 'pointer' }} onClick={() => startEdit(s)}>
                <div className="row-info">
                  <div className="row-name">{s.nombreCompleto}</div>
                  <div className="row-sub">
                    DNI {s.dni} · {s.curso} · Pab. {s.pabellon}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Editar</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function Field({ label, value, onChange, placeholder, required = true }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="field-label">
        {label}
        {required ? ' *' : ''}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 13 }}
      />
    </label>
  );
}
