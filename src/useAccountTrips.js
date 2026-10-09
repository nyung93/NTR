import { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

async function migrateAccountTrips(uid, email) {
  const oldTripsRef = doc(db, 'users', uid, 'planner', 'trips');
  const oldTripsSnapshot = await getDoc(oldTripsRef);
  let oldTrips = oldTripsSnapshot.exists() && Array.isArray(oldTripsSnapshot.data().value) ? oldTripsSnapshot.data().value : [];
  if (!oldTrips.length) {
    try {
      const migratedOwner = localStorage.getItem('travel-planner-legacy-owner-v1');
      const localTrips = JSON.parse(localStorage.getItem('travel-planner-trips-v1') || '[]');
      if (!migratedOwner && Array.isArray(localTrips)) oldTrips = localTrips;
    } catch { /* a new account starts with an empty trip list */ }
  }

  for (const oldTrip of oldTrips) {
    const tripId = `${uid}_${oldTrip.id}`;
    const tripRef = doc(db, 'trips', tripId);
    const currentTrip = await getDoc(tripRef);
    if (!currentTrip.exists()) {
      await setDoc(tripRef, {
        name: oldTrip.name,
        start: oldTrip.start,
        end: oldTrip.end,
        ownerUid: uid,
        ownerEmail: email || '',
        memberUids: [uid],
        memberEmails: email ? [email.toLowerCase()] : [],
        editorUids: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        migratedFromLegacy: true,
        legacyId: oldTrip.id,
      });
    }

    for (const section of ['itinerary', 'spa', 'budget']) {
      const oldSectionRef = doc(db, 'users', uid, 'planner', `${oldTrip.id}-${section}`);
      const oldSection = await getDoc(oldSectionRef);
      if (!oldSection.exists() || !Object.hasOwn(oldSection.data(), 'value')) continue;
      const sectionRef = doc(db, 'trips', tripId, 'planner', section);
      const existingSection = await getDoc(sectionRef);
      if (!existingSection.exists()) {
        await setDoc(sectionRef, { value: oldSection.data().value, updatedAt: serverTimestamp(), updatedBy: uid });
      }
    }
  }

  const selectedRef = doc(db, 'users', uid, 'planner', 'selected-trip');
  const selected = await getDoc(selectedRef);
  let localSelection = '';
  try { localSelection = localStorage.getItem('travel-planner-selected-v1') || ''; } catch { /* optional browser preference */ }
  const selectedLegacyId = selected.exists() ? selected.data().value : localSelection;
  const selectedTrip = oldTrips.find(trip => trip.id === selectedLegacyId) || oldTrips[0];
  const nextSelected = selectedTrip ? `${uid}_${selectedTrip.id}` : '';
  if (selectedTrip && (!selected.exists() || selectedLegacyId !== nextSelected)) {
    await setDoc(selectedRef, { value: nextSelected, updatedAt: serverTimestamp() });
  }
  if (oldTrips.length) {
    try {
      const owner = localStorage.getItem('travel-planner-legacy-owner-v1');
      if (!owner) localStorage.setItem('travel-planner-legacy-owner-v1', uid);
    } catch { /* Firestore migration completed; the marker is only a browser safeguard. */ }
  }
}

export function useAccountTrips(user) {
  const uid = user?.uid;
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return undefined;
    let unsubscribe;
    let active = true;
    setStatus('loading');
    setError('');
    migrateAccountTrips(uid, user.email).then(() => {
      if (!active) return;
      const tripsCollection = collection(db, 'trips');
      const memberQuery = query(tripsCollection, where('memberUids', 'array-contains', uid));
      const email = user?.email?.trim().toLowerCase();
      const emailQuery = email ? query(tripsCollection, where('memberEmails', 'array-contains', email)) : null;
      const ownerQuery = query(tripsCollection, where('ownerUid', '==', uid));
      const streams = [
        { key: 'member', query: memberQuery, docs: [], state: 'loading', error: null },
        ...(emailQuery ? [{ key: 'email', query: emailQuery, docs: [], state: 'loading', error: null }] : []),
        { key: 'owner', query: ownerQuery, docs: [], state: 'loading', error: null },
      ];
      const publishTrips = () => {
        const availableTrips = streams.filter(stream => stream.state === 'ready').flatMap(stream => stream.docs);
        const uniqueTrips = new Map(availableTrips.map(item => [item.id, { id: item.id, ...item.data() }]));
        setTrips([...uniqueTrips.values()].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        setStatus('ready');
        setError('');
      };
      const handleTripsError = (stream, syncError) => {
        stream.state = 'error';
        stream.error = syncError;
        if (streams.some(item => item.state === 'ready')) {
          publishTrips();
          return;
        }
        if (streams.every(item => item.state === 'error')) {
          setStatus('error');
          setError(streams.every(item => item.error?.code === 'permission-denied')
            ? `여행 목록 읽기가 거부됐습니다. 현재 로그인 이메일 ${email || '(없음)'}이 memberEmails에 등록됐거나, 현재 계정이 여행 소유자인지 확인해 주세요.`
            : 'Firebase에서 여행 목록을 불러오지 못했습니다. 연결 상태를 확인해 주세요.');
        }
      };
      const stops = streams.map(stream => onSnapshot(stream.query,
        snapshot => { stream.docs = snapshot.docs; stream.state = 'ready'; publishTrips(); },
        error => handleTripsError(stream, error)));
      unsubscribe = () => stops.forEach(stop => stop());
    }).catch(syncError => {
      if (!active) return;
      setStatus('error');
      setError(syncError.code === 'permission-denied'
        ? '기존 여행 데이터를 옮길 권한이 없습니다. 최신 Firebase 규칙을 게시해 주세요.'
        : '여행 데이터를 준비하지 못했습니다. Firebase 연결을 확인해 주세요.');
    });
    return () => { active = false; unsubscribe?.(); };
  }, [uid, user?.email]);

  return { trips, status, error };
}

export async function createTrip(user, trip) {
  const reference = doc(collection(db, 'trips'));
  await setDoc(reference, {
    name: trip.name,
    start: trip.start,
    end: trip.end,
    ownerUid: user.uid,
    ownerEmail: user.email || '',
    memberUids: [user.uid],
    memberEmails: user.email ? [user.email.toLowerCase()] : [],
    editorUids: [],
    legacyId: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: reference.id, ...trip, ownerUid: user.uid, memberUids: [user.uid], memberEmails: user.email ? [user.email.toLowerCase()] : [], editorUids: [] };
}
