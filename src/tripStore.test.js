import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

// Exercise the production transaction callbacks with atomic writes and retries.
// Security rules still require a separate emulator / authenticated deployment check.
mock.module('firebase/firestore', { namedExports: {
  doc: (db, ...parts) => ({ path: parts.join('/') }),
  serverTimestamp: () => 'server-time',
  runTransaction: async (db, callback) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const writes = [];
      const result = await callback({
        get: async ref => {
          const value = structuredClone(db.records.get(ref.path));
          return { exists: () => value !== undefined, data: () => value };
        },
        set: (ref, value) => writes.push(['set', ref.path, value]),
        delete: ref => writes.push(['delete', ref.path]),
      });
      if (db.beforeCommit) {
        const interrupt = db.beforeCommit;
        db.beforeCommit = null;
        if (interrupt(writes)) continue;
      }
      if (db.failCommit) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
      for (const [operation, path, value] of writes) {
        if (operation === 'set') db.records.set(path, value);
        else db.records.delete(path);
      }
      return result;
    }
    throw new Error('Too many transaction retries');
  },
} });

const { deleteAccountTrip, migrateLegacyTrip, PLANNER_SECTIONS } = await import('./tripStore.js');
const uid = 'owner';
const trip = { id: 'owner_nha-trang', name: '나트랑', ownerUid: uid, memberUids: [uid], memberEmails: ['owner@example.com'] };
const legacy = { id: 'nha-trang', name: '나트랑', start: '2027-03-04', end: '2027-03-09' };
const tombstone = `users/${uid}/planner/deleted-trip-${trip.id}`;
const tripPath = `trips/${trip.id}`;

function fixture() {
  return { records: new Map([
    [tripPath, trip],
    ...PLANNER_SECTIONS.map(section => [`${tripPath}/planner/${section}`, { value: section }]),
    ['trips/shared', { ...trip, id: 'shared', memberEmails: ['owner@example.com', 'friend@example.com'] }],
    ['trips/shared/planner/budget', { value: 'preserve shared budget' }],
    [`users/${uid}/planner/nha-trang-budget`, { value: 'old budget' }],
  ]) };
}

test('deleting a private duplicate preserves the separate shared trip and its budget', async () => {
  const db = fixture();
  const shared = structuredClone(db.records.get('trips/shared'));
  await deleteAccountTrip(db, uid, trip);
  assert.equal(db.records.has(tripPath), false);
  for (const section of PLANNER_SECTIONS) assert.equal(db.records.has(`${tripPath}/planner/${section}`), false);
  assert.equal(db.records.get(tombstone).tripId, trip.id);
  assert.deepEqual(db.records.get('trips/shared'), shared);
  assert.deepEqual(db.records.get('trips/shared/planner/budget'), { value: 'preserve shared budget' });
  assert.equal(await migrateLegacyTrip(db, uid, 'owner@example.com', legacy), false);
  assert.equal(db.records.has(tripPath), false, 'login must not restore the deleted legacy trip');
});

test('non-owner cannot delete any trip data', async () => {
  const db = fixture();
  const before = structuredClone(db.records);
  await assert.rejects(deleteAccountTrip(db, 'other-user', trip), /만든 계정/);
  assert.deepEqual(db.records, before);
});

test('sharing changed during deletion aborts the retried transaction', async () => {
  const db = fixture();
  db.beforeCommit = () => {
    db.records.set(tripPath, { ...trip, memberEmails: [...trip.memberEmails, 'friend@example.com'] });
    return true;
  };
  await assert.rejects(deleteAccountTrip(db, uid, trip), /공유 대상이 변경/);
  assert.equal(db.records.has(tombstone), false);
  for (const section of PLANNER_SECTIONS) assert.equal(db.records.has(`${tripPath}/planner/${section}`), true);
});

test('a rejected commit leaves the entire trip intact', async () => {
  const db = fixture();
  db.failCommit = true;
  const before = structuredClone(db.records);
  await assert.rejects(deleteAccountTrip(db, uid, trip), { code: 'permission-denied' });
  assert.deepEqual(db.records, before);
});

test('deletion also works when some section documents are missing', async () => {
  const db = fixture();
  db.records.delete(`${tripPath}/planner/overview`);
  await deleteAccountTrip(db, uid, trip);
  await deleteAccountTrip(db, uid, trip);
  assert.equal(db.records.has(tripPath), false);
  assert.equal(db.records.has(tombstone), true);
});

test('migration imports missing sections and preserves edited current data', async () => {
  const db = { records: new Map([[`users/${uid}/planner/nha-trang-budget`, { value: 'legacy budget' }]]) };
  assert.equal(await migrateLegacyTrip(db, uid, 'owner@example.com', legacy), true);
  assert.equal(db.records.get(`${tripPath}/planner/budget`).value, 'legacy budget');
  db.records.set(`${tripPath}/planner/budget`, { value: 'edited budget' });
  await migrateLegacyTrip(db, uid, 'owner@example.com', legacy);
  assert.equal(db.records.get(`${tripPath}/planner/budget`).value, 'edited budget');
});

test('a concurrent deletion prevents a migration transaction from restoring the parent', async () => {
  const db = { records: new Map() };
  db.beforeCommit = () => {
    db.records.set(tombstone, { tripId: trip.id });
    return true;
  };
  assert.equal(await migrateLegacyTrip(db, uid, 'owner@example.com', legacy), false);
  assert.equal(db.records.has(tripPath), false);
});

test('deletion between parent migration and section migration does not leave orphan sections', async () => {
  const db = { records: new Map([[`users/${uid}/planner/nha-trang-budget`, { value: 'legacy budget' }]]) };
  db.beforeCommit = () => {
    db.beforeCommit = () => {
      db.records.set(tombstone, { tripId: trip.id });
      db.records.delete(tripPath);
      return true;
    };
    return false;
  };
  await migrateLegacyTrip(db, uid, 'owner@example.com', legacy);
  assert.equal(db.records.has(tripPath), false);
  assert.equal(db.records.has(`${tripPath}/planner/budget`), false);
});
