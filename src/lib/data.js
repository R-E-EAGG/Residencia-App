import {
  collection, collectionGroup, doc, onSnapshot, query, where, orderBy,
  setDoc, deleteDoc, getDoc, getDocs, runTransaction, arrayUnion, serverTimestamp,
  addDoc, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const SCORE_START = 30;
export const SCORE_MIN = 0;

// ---------- Alumnos ----------

export function listenStudents(onData, onError) {
  return onSnapshot(
    collection(db, 'alumnos'),
    (snap) => onData(snap.docs.map((d) => ({ dni: d.id, ...d.data() }))),
    onError
  );
}

// Alta rápida de un alumno nuevo desde el formulario de la app.
// dni es el ID del documento (igual que en la hoja "Asistencia" original).
export async function addStudent(student) {
  const ref = doc(db, 'alumnos', student.dni);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error('Ya existe un alumno cargado con ese DNI.');
  }
  await setDoc(ref, {
    nombreCompleto: student.nombreCompleto,
    curso: student.curso,
    pabellon: student.pabellon,
    telefonoTutor: student.telefonoTutor,
    telefonoTutorLocal: student.telefonoTutorLocal,
  });
}

// Edita un alumno ya cargado. Si cambia el DNI, migra tambien su asistencia y
// su scoring (historial incluido) al nuevo DNI, para no perder nada.
export async function editStudent(originalDni, student) {
  const newDni = student.dni.trim();
  const fields = {
    nombreCompleto: student.nombreCompleto,
    curso: student.curso,
    pabellon: student.pabellon,
    telefonoTutor: student.telefonoTutor,
    telefonoTutorLocal: student.telefonoTutorLocal,
  };

  if (newDni === originalDni) {
    await setDoc(doc(db, 'alumnos', originalDni), fields, { merge: true });
    return;
  }

  const newRef = doc(db, 'alumnos', newDni);
  const existing = await getDoc(newRef);
  if (existing.exists()) {
    throw new Error('Ya existe otro alumno cargado con ese DNI.');
  }

  const batch = writeBatch(db);
  batch.set(newRef, fields);
  batch.delete(doc(db, 'alumnos', originalDni));

  // Migrar scoring (documento + historial).
  const oldScoreRef = doc(db, 'scoring', originalDni);
  const oldScoreSnap = await getDoc(oldScoreRef);
  if (oldScoreSnap.exists()) {
    batch.set(doc(db, 'scoring', newDni), { ...oldScoreSnap.data(), nombreCompleto: fields.nombreCompleto });
    batch.delete(oldScoreRef);
    const histSnap = await getDocs(collection(db, 'scoring', originalDni, 'historial'));
    histSnap.docs.forEach((h) => {
      batch.set(doc(db, 'scoring', newDni, 'historial', h.id), h.data());
      batch.delete(h.ref);
    });
  }

  // Migrar asistencia.
  const asisSnap = await getDocs(query(collection(db, 'asistencia'), where('dni', '==', originalDni)));
  asisSnap.docs.forEach((a) => {
    const data = a.data();
    batch.set(doc(db, 'asistencia', `${newDni}_${data.fecha}`), { ...data, dni: newDni });
    batch.delete(a.ref);
  });

  await batch.commit();
}

// ---------- Asistencia ----------
// Un documento por alumno+día: asistencia/{dni}_{fecha}
// fecha en formato "YYYY-MM-DD". eventos: [{ tipo, detalle, hora, preceptor, timestamp }]

function attendanceDocId(dni, fecha) {
  return `${dni}_${fecha}`;
}

export function listenAttendanceForDate(fecha, onData, onError) {
  const q = query(collection(db, 'asistencia'), where('fecha', '==', fecha));
  return onSnapshot(
    q,
    (snap) => {
      const byDni = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        byDni[data.dni] = data;
      });
      onData(byDni);
    },
    onError
  );
}

// Trae toda la asistencia de un mes ("YYYY-MM") para armar la planilla/reporte.
// Devuelve { [dni]: { [dia]: { eventos: [...] } } }
export async function getAttendanceForMonth(monthKey) {
  const start = `${monthKey}-01`;
  const end = `${monthKey}-31`;
  const q = query(
    collection(db, 'asistencia'),
    where('fecha', '>=', start),
    where('fecha', '<=', end)
  );
  const snap = await getDocs(q);
  const byDni = {};
  snap.docs.forEach((d) => {
    const data = d.data();
    const dia = Number(data.fecha.slice(8, 10));
    byDni[data.dni] = byDni[data.dni] || {};
    byDni[data.dni][dia] = data;
  });
  return byDni;
}

export async function appendEvento(dni, fecha, tipo, detalle, preceptor) {
  const ref = doc(db, 'asistencia', attendanceDocId(dni, fecha));
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const snap = await getDoc(ref);
  const nuevoEvento = { tipo, detalle: detalle || '', hora, preceptor: preceptor || '', timestamp: Timestamp.now() };
  if (snap.exists()) {
    await setDoc(ref, { eventos: arrayUnion(nuevoEvento) }, { merge: true });
  } else {
    await setDoc(ref, { dni, fecha, eventos: [nuevoEvento] });
  }
}

export async function clearAttendanceDay(dni, fecha) {
  const ref = doc(db, 'asistencia', attendanceDocId(dni, fecha));
  await deleteDoc(ref);
}

// ---------- Scoring ----------

export function listenScoring(onData, onError) {
  return onSnapshot(
    collection(db, 'scoring'),
    (snap) => onData(snap.docs.map((d) => ({ dni: d.id, ...d.data() }))),
    onError
  );
}

export function listenScoringHistorial(dni, onData, onError) {
  const q = query(collection(db, 'scoring', dni, 'historial'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

// Trae todas las novedades de scoring de un mes ("YYYY-MM"), de todos los alumnos,
// para el reporte imprimible. Requiere un indice de tipo "Collection group" sobre
// el campo timestamp de la subcoleccion "historial" (Firestore lo pide solo la
// primera vez y da un link para crearlo en un clic).
export async function getScoringForMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const q = query(
    collectionGroup(db, 'historial'),
    where('timestamp', '>=', Timestamp.fromDate(start)),
    where('timestamp', '<', Timestamp.fromDate(end)),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    dni: d.ref.parent.parent.id,
    ...d.data(),
  }));
}

// category: 'ADVERTENCIA' | 'LEVE' | 'MODERADA' | 'GRAVE'
// points: puntos a restar (se ignora y se fuerza a 0 si category es ADVERTENCIA)
export async function addScoringEntry(dni, nombreCompleto, category, points, description, preceptor) {
  const pts = category === 'ADVERTENCIA' ? 0 : Math.max(0, Number(points) || 0);
  const scoreRef = doc(db, 'scoring', dni);

  const newScore = await runTransaction(db, async (tx) => {
    const snap = await tx.get(scoreRef);
    const base = snap.exists() ? Number(snap.data().puntaje) : SCORE_START;
    const next = Math.max(SCORE_MIN, (isNaN(base) ? SCORE_START : base) - pts);
    tx.set(scoreRef, { puntaje: next, nombreCompleto }, { merge: true });
    return next;
  });

  await addDoc(collection(db, 'scoring', dni, 'historial'), {
    categoria: category,
    puntos: pts,
    descripcion: description || '',
    preceptor: preceptor || '',
    timestamp: serverTimestamp(),
  });

  return newScore;
}
