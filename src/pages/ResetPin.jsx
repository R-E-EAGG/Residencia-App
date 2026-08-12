import { useEffect, useState } from 'react';
import { checkResetCode, confirmNewPin, rememberEmail } from '../lib/auth';

function getOobCode() {
  // El link de Firebase agrega los parametros despues del signo "?", que puede
  // quedar antes o despues del "#" segun el navegador. Buscamos en los dos lugares.
  const fromSearch = new URLSearchParams(window.location.search);
  if (fromSearch.get('oobCode')) return fromSearch.get('oobCode');

  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex !== -1) {
    const fromHash = new URLSearchParams(hash.slice(qIndex + 1));
    if (fromHash.get('oobCode')) return fromHash.get('oobCode');
  }
  return null;
}

export default function ResetPin() {
  const [status, setStatus] = useState('checking'); // checking | ready | invalid | done
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const oobCode = getOobCode();
    if (!oobCode) {
      setStatus('invalid');
      return;
    }
    checkResetCode(oobCode)
      .then((mail) => {
        setEmail(mail);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, []);

  function digits(v) {
    return v.replace(/\D/g, '').slice(0, 4);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (pin !== pin2) {
      setError('Los dos PIN no coinciden.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const oobCode = getOobCode();
      await confirmNewPin(oobCode, pin);
      rememberEmail(email);
      setStatus('done');
    } catch (err) {
      setError('No se pudo guardar el PIN nuevo. El link puede haber vencido — pedi uno nuevo desde "Olvide mi PIN".');
      setSaving(false);
    }
  }

  if (status === 'checking') {
    return <div className="login-wrap"><div className="login-box"><p>Verificando el link...</p></div></div>;
  }

  if (status === 'invalid') {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Link invalido o vencido</h1>
          <p>Volve a la app y toca "Olvide mi PIN" para pedir uno nuevo.</p>
          <a className="btn btn-primary" href={window.location.pathname} style={{ display: 'inline-block', textDecoration: 'none', marginTop: 10 }}>
            Volver a la app
          </a>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Listo</h1>
          <p>Tu PIN nuevo ya esta activo. Entra a la app y usalo.</p>
          <a className="btn btn-primary" href={window.location.pathname} style={{ display: 'inline-block', textDecoration: 'none', marginTop: 10 }}>
            Ir a la app
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1>Elegi tu PIN nuevo</h1>
        <p>Para {email}</p>
        <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(digits(e.target.value))} placeholder="PIN nuevo (4 digitos)" autoFocus />
        <input type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(digits(e.target.value))} placeholder="Repeti el PIN" />
        <button type="submit" disabled={saving || pin.length !== 4 || pin2.length !== 4}>
          {saving ? 'Guardando...' : 'Guardar PIN nuevo'}
        </button>
        <div className="login-error">{error}</div>
      </form>
    </div>
  );
}
