function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Ventana horaria en la que se puede cargar asistencia del día actual: 13:00 a 08:00.
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

// Saca solo los digitos de lo que haya cargado el preceptor en el campo de
// telefono (puede tener un nombre pegado, espacios, guiones, etc). Sirve para
// armar el link "tel:" sin depender de que el campo este prolijo.
export function phoneDigits(text) {
  return (text || '').replace(/\D/g, '');
}
