import { useEffect, useState } from 'react';
import { listenContacts, addContact, editContact, deleteContact } from '../lib/data';
import { phoneDigits } from '../lib/dates';

export default function Contactos() {
  const [contacts, setContacts] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => listenContacts(setContacts, (e) => alert('Error: ' + e.message)), []);

  function startEdit(c) {
    setEditingId(c.id);
    setNombre(c.nombre);
    setTelefono(c.telefono);
  }

  function cancelEdit() {
    setEditingId(null);
    setNombre('');
    setTelefono('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await editContact(editingId, nombre.trim(), telefono.trim());
      } else {
        await addContact(nombre.trim(), telefono.trim());
      }
      cancelEdit();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar este contacto?')) return;
    try {
      await deleteContact(id);
      if (editingId === id) cancelEdit();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="top-row">
          <div>
            <h1>Contactos</h1>
            <p className="subtitle">Teléfonos útiles y de emergencia</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <form
          onSubmit={handleSubmit}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}
        >
          <label style={{ display: 'block' }}>
            <div className="field-label">Nombre</div>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Emergencia médica"
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 13 }}
            />
          </label>
          <label style={{ display: 'block' }}>
            <div className="field-label">Teléfono</div>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 107"
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 13 }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={!nombre.trim() || !telefono.trim() || saving} style={{ flex: 1 }}>
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar contacto'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {!contacts ? (
          <div className="loading">Cargando...</div>
        ) : contacts.length === 0 ? (
          <p className="empty">Todavía no hay contactos cargados.</p>
        ) : (
          <ul className="list">
            {contacts.map((c) => {
              const digits = phoneDigits(c.telefono);
              return (
                <li key={c.id} className="row">
                  <div className="row-info" style={{ cursor: 'default' }}>
                    <div className="row-name">{c.nombre}</div>
                    <div className="row-sub">{c.telefono}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {digits && (
                      <a
                        href={`tel:${digits}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
                          borderRadius: 8, background: 'var(--primary-bg)', color: 'var(--primary-dark)', textDecoration: 'none',
                        }}
                      >
                        <i className="ti ti-phone" style={{ fontSize: 15 }} aria-hidden="true" />
                      </a>
                    )}
                    <button
                      className="eraser-btn"
                      style={{ color: 'var(--primary)' }}
                      onClick={() => startEdit(c)}
                    >
                      <i className="ti ti-pencil" style={{ fontSize: 14 }} aria-hidden="true" />
                    </button>
                    <button className="eraser-btn" onClick={() => handleDelete(c.id)}>
                      <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
