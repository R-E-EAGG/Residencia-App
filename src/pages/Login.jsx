import { useState } from 'react';
import { getRememberedEmail, forgetEmail, registerPreceptor, loginWithPin, requestPinReset } from '../lib/auth';

export default function Login() {
  const remembered = getRememberedEmail();
  const [mode, setMode] = useState(remembered ? 'pin' : 'login');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [email, setEmail] = useState('');
  const [apellido, setApellido] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function digits(v) {
    return v.replace(/\D/g, '').slice(0, 4);
  }

  async function handlePinOnly(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithPin(remembered, pin);
    } catch (err) {
      setError('PIN incorrecto. Proba de nuevo.');
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithPin(email.trim(), pin);
    } catch (err) {
      setError('Email o PIN incorrecto.');
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (pin !== pin2) {
      setError('Los dos PIN no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await registerPreceptor(apellido.trim(), email.trim(), pin);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ese email ya tiene una cuenta creada. Toca "Entrar" e ingresa con tu PIN.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Ese email no es valido.');
      } else {
        setError('No se pudo crear el acceso. Proba de nuevo.');
      }
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await requestPinReset(email.trim());
      setMode('forgot-sent');
    } catch (err) {
      setError('No se pudo enviar el mail. Revisa que el email este bien escrito.');
    } finally {
      setLoading(false);
    }
  }

  function switchUser() {
    forgetEmail();
    setPin('');
    setError('');
    setMode('login');
  }

  if (mode === 'pin') {
    return (
      <div className="login-wrap">
        <form className="login-box" onSubmit={handlePinOnly}>
          <h1>Residencia Estudiantil - EAGG</h1>
          <p>Ingresa tu PIN de 4 digitos</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => setPin(digits(e.target.value))}
            placeholder="PIN"
          />
          <button type="submit" disabled={loading || pin.length !== 4}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          <div className="login-error">{error}</div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <button type="button" className="home-logout" onClick={switchUser}>
              No soy yo
            </button>
            <button type="button" className="home-logout" onClick={() => setMode('forgot')}>
              Olvide mi PIN
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="login-wrap">
        <form className="login-box" onSubmit={handleRegister}>
          <h1>Crear mi acceso</h1>
          <p>Primera vez en este celular</p>
          <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Tu apellido" style={{ textAlign: 'left', letterSpacing: 0 }} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email" style={{ textAlign: 'left', letterSpacing: 0 }} />
          <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(digits(e.target.value))} placeholder="Elegi un PIN de 4 digitos" />
          <input type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(digits(e.target.value))} placeholder="Repeti el PIN" />
          <button type="submit" disabled={loading || !apellido.trim() || !email.trim() || pin.length !== 4 || pin2.length !== 4}>
            {loading ? 'Creando...' : 'Crear acceso'}
          </button>
          <div className="login-error">{error}</div>
          <button type="button" className="home-logout" style={{ marginTop: 10 }} onClick={() => setMode('login')}>
            Ya tengo cuenta, entrar
          </button>
        </form>
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <div className="login-wrap">
        <form className="login-box" onSubmit={handleForgot}>
          <h1>Olvide mi PIN</h1>
          <p>Escribi el email con el que te registraste</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email" style={{ textAlign: 'left', letterSpacing: 0 }} />
          <button type="submit" disabled={loading || !email.trim()}>
            {loading ? 'Enviando...' : 'Enviar mail de recuperacion'}
          </button>
          <div className="login-error">{error}</div>
          <button type="button" className="home-logout" style={{ marginTop: 10 }} onClick={() => setMode('login')}>
            Volver
          </button>
        </form>
      </div>
    );
  }

  if (mode === 'forgot-sent') {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Revisa tu mail</h1>
          <p>Te mandamos un link a {email} para elegir un PIN nuevo.</p>
          <button type="button" onClick={() => setMode('login')}>
            Volver a entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={handleLogin}>
        <h1>Residencia Estudiantil - EAGG</h1>
        <p>Entra con tu email y tu PIN</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email" style={{ textAlign: 'left', letterSpacing: 0 }} />
        <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(digits(e.target.value))} placeholder="PIN" />
        <button type="submit" disabled={loading || !email.trim() || pin.length !== 4}>
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
        <div className="login-error">{error}</div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <button type="button" className="home-logout" onClick={() => setMode('register')}>
            Primera vez, crear acceso
          </button>
          <button type="button" className="home-logout" onClick={() => setMode('forgot')}>
            Olvide mi PIN
          </button>
        </div>
      </form>
    </div>
  );
}
