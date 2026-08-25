# Residencia Estudiantil - EAGG

App de asistencia y scoring para la residencia, con React + Firebase (Firestore) + Netlify,
migrada desde un proyecto original en Google Sheets + Apps Script.

## Estructura de datos en Firestore

```
alumnos/{dni}                        -> nombreCompleto, curso, pabellon, telefonoTutor, telefonoTutorLocal
alumnos/{dni}/observaciones/{autoId} -> texto, preceptor, timestamp
asistencia/{dni}_{fecha}             -> dni, fecha ("YYYY-MM-DD"), eventos: [{ tipo, detalle, hora, preceptor, timestamp }]
scoring/{dni}                        -> puntaje, nombreCompleto
scoring/{dni}/historial/{autoId}     -> categoria, puntos, descripcion, preceptor, timestamp
preceptores/{email}                  -> nombre
contactos/{autoId}                   -> nombre, telefono
```

## Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Índices necesarios en Firestore

- Campo único con alcance "Grupo de colecciones" sobre `historial.timestamp` (necesario para
  el detalle de scoring del Reporte mensual). Se crea en Firestore Console -> Índices ->
  Automáticos -> Agregar exención: colección `historial`, campo `timestamp`, tildando tanto
  "Colección" como "Grupo de colecciones".

## Variables de entorno (.env)

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Las mismas 6 variables van cargadas en Netlify (Site configuration -> Environment variables).

## Cómo entra cada preceptor

No hay cuentas creadas a mano. La primera vez, cada preceptor toca "Primera vez, crear acceso",
carga su apellido, su email real y elige un PIN de 4 dígitos. De ahí en más ese celular
recuerda el email y solo pide el PIN. Si se olvida el PIN, lo recupera por mail
("Olvidé mi PIN" -> pantalla propia de reseteo en `/#/reset`).

**Importante**: para que el mail de recuperación funcione, hay que agregar el dominio de
Netlify en Firebase Console -> Authentication -> Settings -> Authorized domains.

## Desarrollo local

```bash
npm install
npm run dev
```

## Desplegar

Conectado por GitHub a Netlify: build command `npm run build`, publish directory `dist`.
Cualquier cambio en la rama principal del repo dispara un redeploy automático.

## Migrar el listado de alumnos desde la hoja original

Ver instrucciones dentro de `scripts/import-alumnos.js`.
