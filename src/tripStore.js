import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export const PLANNER_SECTIONS = ['overview', 'itinerary', 'budget', 'spa'];

function deletionRef(db, uid, tripId) {
  return doc(db, 'users', uid, 'planner', `deleted-trip-${tripId}`);
}

function sharingKey(trip) {
  return JSON.stringify([
    trip.ownerUid,
    [...new Set(trip.memberUids || [])].sort(),
    [...new Set((trip.memberEmails || []).map(email => email.trim().toLowerCase()))].sort(),
  ]);
}

export async function deleteAccountTrip(db, uid, trip) {
  const reference = doc(db, 'trips', trip.id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) return;
    const current = snapshot.data();
    if (!uid || current.ownerUid !== uid) {
      throw new Error('여행을 만든 계정만 삭제할 수 있습니다. 로그인 계정을 확인해 주세요.');
    }
    if (sharingKey(current) !== sharingKey(trip)) {
      throw new Error('여행의 공유 대상이 변경됐습니다. 여행 정보를 다시 열어 공유 대상을 확인한 뒤 삭제해 주세요.');
    }

    // Record the deletion together with the trip so legacy imports cannot restore it.
    transaction.set(deletionRef(db, uid, trip.id), { tripId: trip.id, deletedAt: serverTimestamp() });
    for (const section of PLANNER_SECTIONS) {
      transaction.delete(doc(db, 'trips', trip.id, 'planner', section));
    }
    transaction.delete(reference);
  });
}

export async function migrateLegacyTrip(db, uid, email, oldTrip) {
  const tripId = `${uid}_${oldTrip.id}`;
  const reference = doc(db, 'trips', tripId);
  const deleted = deletionRef(db, uid, tripId);
  const migrated = await runTransaction(db, async transaction => {
    const tombstone = await transaction.get(deleted);
    if (tombstone.exists()) return false;
    const current = await transaction.get(reference);
    if (!current.exists()) {
      transaction.set(reference, {
        name: oldTrip.name, start: oldTrip.start, end: oldTrip.end,
        ownerUid: uid, ownerEmail: email || '', memberUids: [uid],
        memberEmails: email ? [email.toLowerCase()] : [], editorUids: [],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        migratedFromLegacy: true, legacyId: oldTrip.id,
      });
    }
    return true;
  });
  if (!migrated) return false;

  // The existing rules require a committed parent before creating planner sections.
  for (const section of ['itinerary', 'spa', 'budget']) {
    await runTransaction(db, async transaction => {
      const tombstone = await transaction.get(deleted);
      const parent = await transaction.get(reference);
      if (tombstone.exists() || !parent.exists()) return;
      const sectionRef = doc(db, 'trips', tripId, 'planner', section);
      const existing = await transaction.get(sectionRef);
      if (existing.exists()) return;
      const legacy = await transaction.get(doc(db, 'users', uid, 'planner', `${oldTrip.id}-${section}`));
      if (legacy.exists() && Object.hasOwn(legacy.data(), 'value')) {
        transaction.set(sectionRef, { value: legacy.data().value, updatedAt: serverTimestamp(), updatedBy: uid });
      }
    });
  }
  return true;
}
