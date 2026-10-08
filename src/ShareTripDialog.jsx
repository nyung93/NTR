import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Copy, Link2, Trash2, UserPlus, X } from 'lucide-react';
import { functions } from './firebase';

const call = name => httpsCallable(functions, name);
const readableError = error => ({
  'functions/not-found': '초대할 이메일의 계정이 아직 없습니다. 상대방이 먼저 가입해야 합니다.',
  'functions/permission-denied': '여행 소유자만 공유 설정을 변경할 수 있습니다.',
  'functions/unauthenticated': '공유하려면 먼저 로그인해 주세요.',
  'functions/unavailable': 'Firebase 서버 기능이 아직 배포되지 않았습니다. Firebase 배포를 완료해 주세요.',
}[error.code] || error.message || '공유 설정을 처리하지 못했습니다.');

export default function ShareTripDialog({ trip, uid, close }) {
  const [email, setEmail] = useState('');
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadLinks() {
    try {
      const result = await call('listTripInviteLinks')({ tripId: trip.id });
      setLinks(result.data.invites || []);
    } catch (error) { setMessage(readableError(error)); }
  }

  useEffect(() => { loadLinks(); }, [trip.id]);

  async function addMember(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      await call('addTripMemberByEmail')({ tripId: trip.id, email });
      setEmail(''); setMessage('계정을 여행에 추가했습니다. 상대방은 같은 이메일로 로그인하면 이 여행을 볼 수 있습니다.');
    } catch (error) { setMessage(readableError(error)); }
    finally { setBusy(false); }
  }

  async function createLink() {
    setBusy(true); setMessage('');
    try {
      const result = await call('createTripInviteLink')({ tripId: trip.id });
      setNewLink(result.data.url);
      await navigator.clipboard?.writeText(result.data.url).catch(() => {});
      await loadLinks();
      setMessage('초대 링크를 만들었습니다. 7일 동안 유효하며 최대 20개 계정을 초대합니다.');
    } catch (error) { setMessage(readableError(error)); }
    finally { setBusy(false); }
  }

  async function revoke(inviteId) {
    setBusy(true); setMessage('');
    try {
      await call('revokeTripInviteLink')({ tripId: trip.id, inviteId });
      await loadLinks(); setMessage('초대 링크를 취소했습니다.');
    } catch (error) { setMessage(readableError(error)); }
    finally { setBusy(false); }
  }

  async function removeMember(memberUid) {
    if (!window.confirm('이 계정의 여행 접근 권한을 해제할까요?')) return;
    setBusy(true); setMessage('');
    try { await call('removeTripMember')({ tripId: trip.id, memberUid }); setMessage('계정의 접근 권한을 해제했습니다.'); }
    catch (error) { setMessage(readableError(error)); }
    finally { setBusy(false); }
  }

  return <div className="trip-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section className="trip-modal share-trip-modal" role="dialog" aria-modal="true" aria-labelledby="share-trip-title">
      <header><div><span className="eyebrow">TRIP ACCESS</span><h2 id="share-trip-title">{trip.name} 공유</h2></div><button type="button" aria-label="닫기" onClick={close}><X/></button></header>
      <p className="trip-modal-help">초대한 계정은 일정·예산을 함께 수정할 수 있습니다. 초대 링크는 로그인해야 사용할 수 있습니다.</p>
      <form className="share-add-form" onSubmit={addMember}><label>가입한 계정 이메일<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="friend@example.com"/></label><button className="trip-primary" disabled={busy}><UserPlus size={17}/> 계정 추가</button></form>
      <div className="share-members"><h3>접근 권한이 있는 계정</h3>{trip.memberUids?.map((memberUid, index) => <div className="share-member" key={memberUid}><span>{memberUid === uid ? '나 · 소유자' : trip.memberEmails?.[index] || memberUid}</span>{memberUid !== uid && <button disabled={busy} onClick={() => removeMember(memberUid)} aria-label="접근 권한 해제"><X size={16}/></button>}</div>)}</div>
      <div className="share-link-section"><h3><Link2 size={17}/> 초대 링크</h3><p>로그인한 계정 최대 20개가 사용할 수 있고, 7일 후 만료됩니다.</p><button className="trip-secondary" onClick={createLink} disabled={busy}><Link2 size={17}/> 새 초대 링크 만들기</button>
        {newLink && <div className="share-new-link"><input readOnly value={newLink} onFocus={event => event.target.select()}/><button onClick={() => navigator.clipboard?.writeText(newLink)} aria-label="링크 복사"><Copy size={17}/></button></div>}
        {links.filter(link => !link.revoked && link.expiresAt > Date.now()).map(link => <div className="share-link-row" key={link.id}><span>만료 {new Date(link.expiresAt).toLocaleDateString('ko-KR')} · 사용 {link.useCount}/20</span><button disabled={busy} onClick={() => revoke(link.id)} aria-label="초대 링크 취소"><Trash2 size={16}/></button></div>)}
      </div>
      {message && <p className="trip-modal-message" role="status">{message}</p>}
      <footer><button className="trip-secondary" onClick={close}>닫기</button></footer>
    </section>
  </div>;
}
