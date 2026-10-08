const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();
const db = getFirestore();
const region = 'asia-northeast3';
const appOrigin = 'https://ntr-peach.vercel.app';

function requireUser(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', '로그인 후 이용해 주세요.');
  return request.auth;
}

function requireAdmin(request) {
  const auth = requireUser(request);
  if (auth.token.admin !== true) throw new HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  return auth;
}

async function requireOwner(tripId, uid) {
  if (typeof tripId !== 'string' || tripId.length > 150) throw new HttpsError('invalid-argument', '여행 정보를 확인해 주세요.');
  const reference = db.doc(`trips/${tripId}`);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data().ownerUid !== uid) throw new HttpsError('permission-denied', '여행 소유자만 관리할 수 있습니다.');
  return { reference, data: snapshot.data() };
}

exports.recordAppAccess = onCall({ region }, async request => {
  const auth = requireUser(request);
  await db.doc(`adminAccess/${auth.uid}`).set({
    uid: auth.uid,
    email: auth.token.email || '',
    lastAccessAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { ok: true };
});

exports.addTripMemberByEmail = onCall({ region }, async request => {
  const auth = requireUser(request);
  const email = String(request.data?.email || '').trim().toLowerCase();
  const tripId = request.data?.tripId;
  if (!email || email.length > 254 || !email.includes('@')) throw new HttpsError('invalid-argument', '올바른 이메일 주소를 입력해 주세요.');
  const { reference, data } = await requireOwner(tripId, auth.uid);
  let invitee;
  try { invitee = await getAuth().getUserByEmail(email); }
  catch (error) {
    if (error.code === 'auth/user-not-found') throw new HttpsError('not-found', '먼저 앱에서 계정을 만든 사람의 이메일을 입력해 주세요.');
    throw error;
  }
  if (invitee.uid === auth.uid) throw new HttpsError('invalid-argument', '본인 계정은 이미 여행 소유자입니다.');
  if (data.memberUids.includes(invitee.uid)) return { ok: true, alreadyMember: true };
  await reference.update({
    memberUids: FieldValue.arrayUnion(invitee.uid),
    memberEmails: FieldValue.arrayUnion(email),
    editorUids: FieldValue.arrayUnion(invitee.uid),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true, alreadyMember: false };
});

exports.removeTripMember = onCall({ region }, async request => {
  const auth = requireUser(request);
  const tripId = request.data?.tripId;
  const memberUid = String(request.data?.memberUid || '');
  const { reference, data } = await requireOwner(tripId, auth.uid);
  if (!memberUid || memberUid === auth.uid) throw new HttpsError('invalid-argument', '소유자는 여행에서 제외할 수 없습니다.');
  if (!data.memberUids.includes(memberUid)) return { ok: true };
  const memberRecord = await getAuth().getUser(memberUid).catch(() => null);
  await reference.update({
    memberUids: FieldValue.arrayRemove(memberUid),
    memberEmails: memberRecord?.email ? FieldValue.arrayRemove(memberRecord.email.toLowerCase()) : FieldValue.arrayRemove(''),
    editorUids: FieldValue.arrayRemove(memberUid),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

exports.createTripInviteLink = onCall({ region }, async request => {
  const auth = requireUser(request);
  const tripId = request.data?.tripId;
  await requireOwner(tripId, auth.uid);
  const token = crypto.randomBytes(32).toString('base64url');
  const inviteId = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.doc(`shareInvites/${inviteId}`).set({
    tripId,
    createdBy: auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    revoked: false,
    useCount: 0,
    maxUses: 20,
    role: 'editor',
  });
  return { inviteId, url: `${appOrigin}/?invite=${token}`, expiresAt: expiresAt.toMillis() };
});

exports.listTripInviteLinks = onCall({ region }, async request => {
  const auth = requireUser(request);
  const tripId = request.data?.tripId;
  await requireOwner(tripId, auth.uid);
  const snapshot = await db.collection('shareInvites').where('tripId', '==', tripId).limit(100).get();
  const invites = snapshot.docs.map(item => ({
    id: item.id,
    createdAt: item.data().createdAt?.toMillis?.() || 0,
    expiresAt: item.data().expiresAt?.toMillis?.() || 0,
    revoked: item.data().revoked === true,
    useCount: item.data().useCount || 0,
  })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
  return { invites };
});

exports.revokeTripInviteLink = onCall({ region }, async request => {
  const auth = requireUser(request);
  const tripId = request.data?.tripId;
  const inviteId = String(request.data?.inviteId || '');
  await requireOwner(tripId, auth.uid);
  if (!/^[a-f0-9]{64}$/.test(inviteId)) throw new HttpsError('invalid-argument', '초대 링크를 확인해 주세요.');
  const inviteRef = db.doc(`shareInvites/${inviteId}`);
  const invite = await inviteRef.get();
  if (!invite.exists || invite.data().tripId !== tripId) throw new HttpsError('not-found', '초대 링크를 찾을 수 없습니다.');
  await inviteRef.update({ revoked: true, revokedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

exports.acceptTripInviteLink = onCall({ region }, async request => {
  const auth = requireUser(request);
  const token = String(request.data?.token || '');
  if (token.length < 30 || token.length > 100) throw new HttpsError('invalid-argument', '초대 링크가 올바르지 않습니다.');
  const inviteId = crypto.createHash('sha256').update(token).digest('hex');
  const inviteRef = db.doc(`shareInvites/${inviteId}`);
  const inviteCheck = await inviteRef.get();
  if (!inviteCheck.exists) throw new HttpsError('not-found', '초대 링크가 만료되었거나 올바르지 않습니다.');
  const tripId = inviteCheck.data().tripId;
  await db.runTransaction(async transaction => {
    const inviteSnapshot = await transaction.get(inviteRef);
    const tripRef = db.doc(`trips/${tripId}`);
    const tripSnapshot = await transaction.get(tripRef);
    if (!inviteSnapshot.exists || !tripSnapshot.exists) throw new HttpsError('not-found', '여행 초대 정보를 찾을 수 없습니다.');
    const invite = inviteSnapshot.data();
    const trip = tripSnapshot.data();
    if (invite.revoked || invite.expiresAt.toMillis() < Date.now() || invite.useCount >= invite.maxUses) throw new HttpsError('failed-precondition', '초대 링크가 만료되었거나 사용이 종료되었습니다.');
    if (!trip.memberUids.includes(auth.uid)) {
      transaction.update(tripRef, {
        memberUids: FieldValue.arrayUnion(auth.uid),
        memberEmails: auth.token.email ? FieldValue.arrayUnion(auth.token.email.toLowerCase()) : FieldValue.arrayUnion(''),
        editorUids: FieldValue.arrayUnion(auth.uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(inviteRef, { useCount: FieldValue.increment(1) });
    }
  });
  return { tripId };
});

exports.getAdminDashboard = onCall({ region }, async request => {
  requireAdmin(request);
  const [usersResult, tripsSnapshot, accessSnapshot] = await Promise.all([
    getAuth().listUsers(1000),
    db.collection('trips').limit(1000).get(),
    db.collection('adminAccess').limit(2000).get(),
  ]);
  const accesses = new Map(accessSnapshot.docs.map(item => [item.id, item.data().lastAccessAt?.toMillis?.() || null]));
  return {
    members: usersResult.users.map(item => ({
      uid: item.uid,
      email: item.email || '',
      displayName: item.displayName || '',
      createdAt: item.metadata.creationTime ? Date.parse(item.metadata.creationTime) : null,
      lastSignInAt: item.metadata.lastSignInTime ? Date.parse(item.metadata.lastSignInTime) : null,
      lastAccessAt: accesses.get(item.uid) || null,
      disabled: item.disabled,
    })),
    trips: tripsSnapshot.docs.map(item => {
      const trip = item.data();
      return { id: item.id, name: trip.name || '', start: trip.start || '', end: trip.end || '', ownerUid: trip.ownerUid || '', ownerEmail: trip.ownerEmail || '', createdAt: trip.createdAt?.toMillis?.() || null, memberCount: trip.memberUids?.length || 0 };
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  };
});

exports.getAdminTripDetails = onCall({ region }, async request => {
  const auth = requireAdmin(request);
  const tripId = String(request.data?.tripId || '');
  const tripRef = db.doc(`trips/${tripId}`);
  const [tripSnapshot, plannerSnapshot] = await Promise.all([
    tripRef.get(),
    tripRef.collection('planner').get(),
  ]);
  if (!tripSnapshot.exists) throw new HttpsError('not-found', '여행을 찾을 수 없습니다.');
  const sections = Object.fromEntries(plannerSnapshot.docs.map(item => [item.id, item.data().value]));
  await db.collection('adminTripViews').add({ adminUid: auth.uid, tripId, viewedAt: FieldValue.serverTimestamp() });
  const trip = tripSnapshot.data();
  return { trip: { id: tripId, ...trip, createdAt: trip.createdAt?.toMillis?.() || null }, sections };
});

exports.deleteTrip = onCall({ region }, async request => {
  const auth = requireUser(request);
  const tripId = request.data?.tripId;
  const { reference } = await requireOwner(tripId, auth.uid);
  const invites = await db.collection('shareInvites').where('tripId', '==', tripId).get();
  if (!invites.empty) {
    const batch = db.batch();
    invites.docs.forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
  await db.recursiveDelete(reference);
  return { ok: true };
});
