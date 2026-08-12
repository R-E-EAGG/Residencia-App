import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Firebase exige contrasenas de al menos 6 caracteres. El personal solo escribe
// un PIN de 4 digitos; por dentro se completa con este prefijo fijo antes de
// mandarlo a Firebase. Ejemplo: PIN 4839 -> contrasena real "rq4839".
const PIN_PASSWORD_PREFIX = 'rq';
export function pinToPassword(pin) {
  return PIN_PASSWORD_PREFIX + pin;
}

// El celular "recuerda" el email del preceptor que se registro en el, para que
// las veces siguientes alcance con escribir solo el PIN.
const REMEMBERED_EMAIL_KEY = 'residencia_email';
export function getRememberedEmail() {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
}
export function rememberEmail(email) {
  localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
}
export function forgetEmail() {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

// Primera vez: crea la cuenta y guarda el apellido en preceptores/{email}.
export async function registerPreceptor(apellido, email, pin) {
  const cred = await createUserWithEmailAndPassword(auth, email, pinToPassword(pin));
  await setDoc(doc(db, 'preceptores', email), { nombre: apellido });
  rememberEmail(email);
  return cred.user;
}

// Login normal, con PIN (y el email, guardado en el celular o recien tipeado).
export async function loginWithPin(email, pin) {
  await signInWithEmailAndPassword(auth, email, pinToPassword(pin));
  rememberEmail(email);
}

// "Olvide mi PIN": manda un mail con un link que abre nuestra propia pantalla
// de reseteo (ResetPin.jsx), en vez de la pagina generica de Firebase.
export async function requestPinReset(email) {
  const resetUrl = `${window.location.origin}${window.location.pathname}#/reset`;
  await sendPasswordResetEmail(auth, email, { url: resetUrl, handleCodeInApp: true });
}

export async function checkResetCode(oobCode) {
  return verifyPasswordResetCode(auth, oobCode); // devuelve el email si el link es valido
}

export async function confirmNewPin(oobCode, newPin) {
  await confirmPasswordReset(auth, oobCode, pinToPassword(newPin));
}
