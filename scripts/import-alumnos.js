// Uso:
//   1. En Google Sheets: Archivo -> Descargar -> Valores separados por comas (.csv), de la hoja "Asistencia".
//   2. Guarda ese archivo como alumnos.csv en esta misma carpeta (scripts/).
//   3. Descarga una clave de cuenta de servicio: Firebase Console -> Configuracion del proyecto ->
//      Cuentas de servicio -> Generar nueva clave privada. Guardala como scripts/service-account.json.
//   4. Desde la carpeta scripts/: npm install firebase-admin csv-parse
//   5. node import-alumnos.js
//
// El CSV debe tener las columnas en este orden (igual que la hoja "Asistencia"):
// DNI, Apellido y Nombre, Curso, Pabellon, Telefono Tutor, Telefono Tutor Local

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(readFileSync(new URL('./service-account.json', import.meta.url)));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const csvText = readFileSync(new URL('./alumnos.csv', import.meta.url), 'utf8');
const rows = parse(csvText, { skip_empty_lines: true });

async function run() {
  const dataRows = rows[0][0] === 'DNI' ? rows.slice(1) : rows;
  let count = 0;
  for (const row of dataRows) {
    const [dni, nombreCompleto, curso, pabellon, telefonoTutor, telefonoTutorLocal] = row.map((c) =>
      (c || '').trim()
    );
    if (!dni) continue;
    await db.doc(`alumnos/${dni}`).set({
      nombreCompleto: nombreCompleto || '',
      curso: curso || '',
      pabellon: pabellon || '',
      telefonoTutor: telefonoTutor || '',
      telefonoTutorLocal: telefonoTutorLocal || '',
    });
    count++;
  }
  console.log(`Importados ${count} alumnos.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
