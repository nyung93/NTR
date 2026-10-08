import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : JSON.parse(value);
  } catch { return fallback; }
}

// Keeps an offline browser copy while syncing the same value to the signed-in
// user's private planner document. Legacy local data is used only to seed a
// document the first time that account opens it.
export function useSyncedState(localKey, initialValue, uid, documentId) {
  const accountKey = uid ? `${localKey}:user:${uid}` : localKey;
  const [value, setValue] = useState(() => read(accountKey, read(localKey, initialValue)));
  const [status, setStatus] = useState(uid ? 'loading' : 'local');
  const [error, setError] = useState('');
  const ready = useRef(false);
  const serialized = useRef(JSON.stringify(value));

  useEffect(() => {
    try { localStorage.setItem(accountKey, JSON.stringify(value)); } catch { /* Firestore remains the durable copy. */ }
  }, [accountKey, value]);

  useEffect(() => {
    if (!uid) { ready.current = false; setStatus('local'); return undefined; }
    const reference = doc(db, 'users', uid, 'planner', documentId);
    ready.current = false;
    setStatus('loading');
    setError('');
    const unsubscribe = onSnapshot(reference, async snapshot => {
      try {
        if (snapshot.exists() && Object.hasOwn(snapshot.data(), 'value')) {
          const remoteValue = snapshot.data().value;
          const remoteJson = JSON.stringify(remoteValue);
          const remoteChanged = remoteJson !== serialized.current;
          serialized.current = remoteJson;
          if (remoteChanged) setValue(remoteValue);
          try { localStorage.setItem(accountKey, remoteJson); } catch { /* optional offline cache */ }
        } else {
          const seed = read(accountKey, read(localKey, initialValue));
          serialized.current = JSON.stringify(seed);
          await setDoc(reference, { value: seed, updatedAt: serverTimestamp() });
          if (JSON.stringify(seed) !== JSON.stringify(value)) setValue(seed);
        }
        ready.current = true;
        setStatus('synced');
        setError('');
      } catch (syncError) {
        ready.current = true;
        setStatus('error');
        setError(syncError?.code === 'permission-denied'
          ? 'Firestore 보안 규칙이 계정 저장을 허용하지 않습니다. 콘솔의 규칙을 배포해 주세요.'
          : 'Firebase에 연결하지 못했습니다. 네트워크와 Firebase 설정을 확인해 주세요.');
      }
    }, syncError => {
      ready.current = true;
      setStatus('error');
      setError(syncError?.code === 'permission-denied'
        ? 'Firestore 보안 규칙이 계정 저장을 허용하지 않습니다. 콘솔의 규칙을 배포해 주세요.'
        : 'Firebase에 연결하지 못했습니다. 네트워크와 Firebase 설정을 확인해 주세요.');
    });
    return () => { ready.current = false; unsubscribe(); };
  }, [uid, documentId, accountKey, localKey]);

  useEffect(() => {
    if (!uid || !ready.current || status === 'error') return undefined;
    const nextJson = JSON.stringify(value);
    if (nextJson === serialized.current) return undefined;
    const reference = doc(db, 'users', uid, 'planner', documentId);
    const timer = setTimeout(async () => {
      try {
        await setDoc(reference, { value, updatedAt: serverTimestamp() });
        serialized.current = nextJson;
        setStatus('synced');
        setError('');
      } catch (syncError) {
        setStatus('error');
        setError(syncError?.code === 'permission-denied'
          ? 'Firestore 보안 규칙이 계정 저장을 허용하지 않습니다. 콘솔의 규칙을 배포해 주세요.'
          : '변경사항을 Firebase에 저장하지 못했습니다. 네트워크를 확인해 주세요.');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [uid, documentId, status, value]);

  return [value, setValue, status, error];
}
