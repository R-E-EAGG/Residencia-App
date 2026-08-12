import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const PreceptorContext = createContext({ nombre: '', email: '' });

export function PreceptorProvider({ user, children }) {
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    const unsub = onSnapshot(doc(db, 'preceptores', user.email), (snap) => {
      setNombre(snap.exists() ? snap.data().nombre : user.email);
    });
    return unsub;
  }, [user?.email]);

  return (
    <PreceptorContext.Provider value={{ nombre, email: user?.email || '' }}>
      {children}
    </PreceptorContext.Provider>
  );
}

export function usePreceptor() {
  return useContext(PreceptorContext);
}
