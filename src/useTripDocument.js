import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function readStored(keys, fallback) {
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value != null) return JSON.parse(value);
    } catch { /* continue through older cache names */ }
  }
  return fallback;
}

export function useTripDocument({ uid, tripId, section, initialValue, legacyKeys = [], legacyId = '' }) {
  const accountKey = `planner:${uid}:${tripId}:${section}`;
  const oldCloudKey = legacyId ? `${legacyId}-${section}` : '';
  const [value, setValue] = useState(() => readStored([accountKey, ...legacyKeys], initialValue));
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const ready = useRef(false);
  const serialized = useRef(JSON.stringify(value));

  useEffect(() => {
    try { localStorage.setItem(accountKey, JSON.stringify(value)); } catch { /* offline cache is optional */ }
  }, [accountKey, value]);

  useEffect(() => {
    if (!uid || !tripId) return undefined;
    const reference = doc(db, 'trips', tripId, 'planner', section);
    ready.current = false;
    setStatus('loading');
    setError('');
    const unsubscribe = onSnapshot(reference, async snapshot => {
      try {
        if (snapshot.exists() && Object.hasOwn(snapshot.data(), 'value')) {
          const remoteValue = snapshot.data().value;
          const remoteJson = JSON.stringify(remoteValue);
          const changed = remoteJson !== serialized.current;
          serialized.current = remoteJson;
          if (changed) setValue(remoteValue);
          try { localStorage.setItem(accountKey, remoteJson); } catch { /* offline cache is optional */ }
        } else {
          const legacySnapshot = oldCloudKey ? await getDoc(doc(db, 'users', uid, 'planner', oldCloudKey)) : null;
          const seed = legacySnapshot?.exists() && Object.hasOwn(legacySnapshot.data(), 'value')
            ? legacySnapshot.data().value : readStored([accountKey, ...legacyKeys], initialValue);
          await setDoc(reference, { value: seed, updatedAt: serverTimestamp(), updatedBy: uid });
          serialized.current = JSON.stringify(seed);
          if (JSON.stringify(seed) !== JSON.stringify(value)) setValue(seed);
        }
        ready.current = true;
        setStatus('ready');
        setError('');
      } catch (syncError) {
        ready.current = true;
        setStatus('error');
        setError(syncError.code === 'permission-denied'
          ? '이 여행을 수정할 권한이 없습니다. 소유자에게 편집 권한을 요청하세요.'
          : '여행 데이터를 Firebase에서 불러오지 못했습니다.');
      }
    }, syncError => {
      ready.current = true;
      setStatus('error');
      setError(syncError.code === 'permission-denied'
        ? '이 여행을 수정할 권한이 없습니다. 소유자에게 편집 권한을 요청하세요.'
        : '여행 데이터를 Firebase에서 불러오지 못했습니다.');
    });
    return () => { ready.current = false; unsubscribe(); };
  }, [uid, tripId, section, accountKey, oldCloudKey]);

  useEffect(() => {
    if (!ready.current || status === 'error') return undefined;
    const next = JSON.stringify(value);
    if (next === serialized.current) return undefined;
    const reference = doc(db, 'trips', tripId, 'planner', section);
    const timer = setTimeout(async () => {
      try {
        await setDoc(reference, { value, updatedAt: serverTimestamp(), updatedBy: uid });
        serialized.current = next;
        setStatus('ready');
        setError('');
      } catch (syncError) {
        setStatus('error');
        setError(syncError.code === 'permission-denied'
          ? '저장 권한이 없습니다. 여행 소유자에게 편집 권한을 요청하세요.'
          : '변경사항을 Firebase에 저장하지 못했습니다.');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [uid, tripId, section, status, value]);

  return [value, setValue, status, error];
}
