function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isWithinWindow() {
  const h = new Date().getHours();
  return h >= 13 || h < 8;
}

export function lastEventKind(eventos) {
  if (!eventos || eventos.length === 0) return null;
  return eventos[eventos.length - 1].tipo || null;
}

export function eventosToText(eventos) {
  if (!eventos || eventos.length === 0) return '';
  return eventos
    .map((e) => {
      const base = e.detalle ? `${e.tipo}: ${e.detalle}` : e.tipo;
      const quien = e.preceptor ? ` · ${e.preceptor}` : '';
      return `${base} (${e.hora}${quien})`;
    })
    .join('\n');
}

export function phoneDigits(text) {
  return (text || '').replace(/\D/g, '');
}

// Formatea fecha + hora sin segundos (dd/mm/aaaa hh:mm). toLocaleString('es-AR')
// sin opciones incluye segundos por defecto, por eso este helper centraliza el formato.
export function fmtDateTime(date) {
  if (!date) return '';
  return date.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// Formateadores de fecha/hora SIN segundos, para usar en toda la app
// (evita que toLocaleString muestre "14:35:10" en vez de "14:35").
export function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('es-AR');
}
export function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
export function formatDateTime(date) {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
}
