import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const PIN_PASSWORD_PREFIX = 'rq';
export function pinToPassword(pin) {
  return PIN_PASSWORD_PREFIX + pin;
}

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

export async function registerPreceptor(apellido, email, pin) {
  const cred = await createUserWithEmailAndPassword(auth, email, pinToPassword(pin));
  await setDoc(doc(db, 'preceptores', email), { nombre: apellido });
  rememberEmail(email);
  return cred.user;
}

export async function loginWithPin(email, pin) {
  await signInWithEmailAndPassword(auth, email, pinToPassword(pin));
  rememberEmail(email);
}

export async function requestPinReset(email) {
  const resetUrl = `${window.location.origin}${window.location.pathname}#/reset`;
  await sendPasswordResetEmail(auth, email, { url: resetUrl, handleCodeInApp: true });
}

export async function checkResetCode(oobCode) {
  return verifyPasswordResetCode(auth, oobCode);
}

export async function confirmNewPin(oobCode, newPin) {
  await confirmPasswordReset(auth, oobCode, pinToPassword(newPin));
}
