# Residencia Estudiantil — Asistencia y Scoring

Version migrada a React + Firebase (Firestore) + Netlify, a partir del proyecto original en
Google Sheets + Apps Script. Mismas pantallas y misma logica (asistencia diaria con AUSENTE/RETIRO/REGRESO,
scoring con categorias ADVERTENCIA/LEVE/MODERADA/GRAVE), mas:

- Cambios en tiempo real entre dispositivos (sin auto-refresco cada 45s).
- Escritura segura del puntaje (transacciones, sin condiciones de carrera entre dos preceptores).
- Un PIN de 4 dígitos por preceptor, elegido por cada uno la primera vez que entra (sin que nadie
  tenga que crearle la cuenta a mano). Cada carga de asistencia o scoring queda firmada con su apellido.
- Recuperación de PIN por mail, si alguien lo olvida.
- Alta rapida de alumnos con formulario, sin tocar Firebase a mano.
- Reporte mensual: planilla por dia + detalle completo de movimientos, con boton para
  imprimir o descargar como PDF.

## 1. Crear el proyecto en Firebase

1. Anda a https://console.firebase.google.com -> Agregar proyecto (no hace falta Google Analytics).
2. **Compilacion -> Firestore Database -> Crear base de datos** -> modo produccion -> region cercana
   (ej. `southamerica-east1`).
3. **Compilacion -> Authentication -> Comenzar** -> pestana "Sign-in method" -> habilita
   **Correo electronico/contrasena**.
4. **Configuracion del proyecto** (engranaje) -> pestana "General" -> "Tus apps" -> icono `</>` (Web) ->
   registra una app -> copia los 6 valores de `firebaseConfig` (ya estan cargados en `.env` en este
   proyecto si seguiste la conversacion con Claude paso a paso).

## 2. Como entra cada preceptor (no hace falta que vos crees nada)

No hay que dar de alta cuentas a mano. La primera vez que un preceptor abre el link, toca
"Primera vez, crear acceso", escribe su apellido, su email real y elige un PIN de 4 digitos. De ahi en
mas, ese celular se acuerda de su email y solo pide el PIN. Si entra desde otro celular, pide
email + PIN juntos esa primera vez. Si se olvida el PIN, toca "Olvide mi PIN", pone su email, y le
llega un mail para elegir uno nuevo.

## 3. Publicar las reglas de seguridad de Firestore

En Firebase Console -> Firestore Database -> pestana **Reglas**, pega el contenido de `firestore.rules`
(ya esta en este proyecto) y publica. Esto impide que alguien sin PIN lea o escriba datos.

## 4. Configurar las variables de entorno

Copia `.env.example` a `.env` y completa con los valores de `firebaseConfig` del paso 1.4:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 5. Probar en local

```bash
npm install
npm run dev
```

Abri la URL que muestra la terminal, ingresa el PIN de cualquiera de los 6 preceptores.

## 6. Migrar el listado de alumnos desde la hoja actual

Para no tipear de nuevo el listado completo al arrancar, segui las instrucciones dentro de
`scripts/import-alumnos.js` (exportar la hoja "Asistencia" como CSV, generar una clave de cuenta de
servicio, y correr el script). Para altas nuevas de ahi en mas, se usa la pantalla "Nuevo alumno"
dentro de la app.

## 7. Subir a GitHub

```bash
git init
git add .
git commit -m "Migracion inicial a Firebase"
git branch -M main
git remote add origin <URL-de-tu-repo-en-GitHub>
git push -u origin main
```

## 8. Desplegar en Netlify

1. https://app.netlify.com -> **Add new site -> Import an existing project** -> elegi tu repo de GitHub.
2. Build command: `npm run build` — Publish directory: `dist`.
3. En **Site configuration -> Environment variables**, carga las mismas 6 variables `VITE_FIREBASE_...`
   del paso 4.
4. Deploy. Netlify da una URL (`algo.netlify.app`); se puede cambiar o poner un dominio propio en
   **Domain settings**.
5. **Importante, recien en este paso**: en Firebase Console -> Authentication -> Settings ->
   "Authorized domains" -> agrega el dominio de Netlify (ej. `algo.netlify.app`). Sin este paso, el
   mail de "Olvide mi PIN" no puede abrir la app para elegir el PIN nuevo.

## Estructura de datos en Firestore

```
alumnos/{dni}                        -> nombreCompleto, curso, pabellon, telefonoTutor, telefonoTutorLocal
asistencia/{dni}_{fecha}             -> dni, fecha ("YYYY-MM-DD"), eventos: [{ tipo, detalle, hora, preceptor, timestamp }]
scoring/{dni}                        -> puntaje, nombreCompleto
scoring/{dni}/historial/{autoId}     -> categoria, puntos, descripcion, preceptor, timestamp
preceptores/{email}                  -> nombre  (uno por cada uno de los 6 preceptores)
```

## Reporte mensual

Desde el menu de Inicio -> "Reporte mensual": elegis mes y pabellon, y muestra una planilla (alumno x
dia, con A/R/I) mas el detalle completo de cada movimiento (fecha, hora, tipo, texto cargado y que
preceptor lo hizo). El boton "Descargar / imprimir PDF" abre el dialogo de impresion del navegador —
ahi se elige "Guardar como PDF" para bajarlo prolijo, o imprimir directo si hay impresora.
