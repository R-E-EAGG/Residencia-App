import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addStudent } from '../lib/data';

const EMPTY = { dni: '', nombreCompleto: '', curso: '', pabellon: '', telefonoTutor: '', telefonoTutorLocal: '' };

export default function Alumnos() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const canSave = form.dni.trim() && form.nombreCompleto.trim() && form.curso.trim() && form.pabellon.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await addStudent({
        dni: form.dni.trim(),
        nombreCompleto: form.nombreCompleto.trim(),
        curso: form.curso.trim(),
        pabellon: form.pabellon.trim().toUpperCase(),
        telefonoTutor: form.telefonoTutor.trim(),
        telefonoTutorLocal: form.telefonoTutorLocal.trim(),
      });
      setMsg(`Alumno "${form.nombreCompleto.trim()}" cargado.`);
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
        <Link className="back-link" to="/">
          ← Inicio
        </Link>
        <div className="top-row">
          <div>
            <h1>Nuevo alumno</h1>
            <p className="subtitle">Carga rápida al listado maestro</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="DNI" value={form.dni} onChange={(v) => set('dni', v)} />
          <Field label="Apellido y nombre" value={form.nombreCompleto} onChange={(v) => set('nombreCompleto', v)} />
          <Field label="Curso" value={form.curso} onChange={(v) => set('curso', v)} placeholder="Ej: 4to B" />
          <Field label="Pabellón" value={form.pabellon} onChange={(v) => set('pabellon', v)} placeholder="Ej: A" />
          <Field label="Teléfono tutor" value={form.telefonoTutor} onChange={(v) => set('telefonoTutor', v)} required={false} />
          <Field label="Teléfono tutor local" value={form.telefonoTutorLocal} onChange={(v) => set('telefonoTutorLocal', v)} required={false} />

          <button className="btn btn-primary" type="submit" disabled={!canSave || saving}>
            {saving ? 'Guardando...' : 'Guardar alumno'}
          </button>
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--red-text)' : 'var(--green-text)' }}>{msg}</div>}
        </form>
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
