import React, { useState } from 'react';
import { CalendarDays, PlaneTakeoff, Building2, Trash2, X } from 'lucide-react';

export function TripSettingsDialog({ trip, onClose, onSave, onDelete, busy }) {
  const owner = trip.ownerUid === trip.currentUid;
  const [draft, setDraft] = useState(() => ({
    name: trip.name || '',
    start: trip.start || '',
    end: trip.end || '',
    purpose: trip.purpose || '',
    participants: (trip.participants?.length ? trip.participants : [{ id: 'p1', name: '민영' }, { id: 'p2', name: '다미' }]).map(person => ({ ...person })),
    memberUids: [...new Set([trip.ownerUid, ...(trip.memberUids || [])].filter(Boolean))],
  }));
  const [newUid, setNewUid] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const update = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));

  const addParticipant = () => update('participants', [...draft.participants, { id: crypto.randomUUID(), name: '' }]);
  const setParticipant = (id, name) => update('participants', draft.participants.map(person => person.id === id ? { ...person, name } : person));
  const removeParticipant = id => update('participants', draft.participants.filter(person => person.id !== id));
  const addUid = () => {
    const uid = newUid.trim();
    if (!uid) return setError('공유할 Firebase UID를 입력하세요.');
    if (draft.memberUids.includes(uid)) return setError('이미 등록된 UID입니다.');
    if (draft.memberUids.length >= 20) return setError('여행 하나에 최대 20개 계정을 등록할 수 있습니다.');
    update('memberUids', [...draft.memberUids, uid]);
    setNewUid('');
    setError('');
  };
  const copyUid = async () => {
    try { await navigator.clipboard.writeText(trip.currentUid); setMessage('내 UID를 복사했습니다.'); }
    catch { setMessage('내 UID를 직접 선택해 복사해 주세요.'); }
  };
  const submit = async event => {
    event.preventDefault();
    const names = draft.participants.map(person => person.name.trim());
    if (!draft.name.trim() || !draft.start || !draft.end || Date.parse(draft.end) < Date.parse(draft.start)) return setError('여행지 이름과 여행 기간을 확인해 주세요.');
    if (!names.length || names.some(name => !name) || new Set(names).size !== names.length) return setError('여행자 이름을 빈칸이나 중복 없이 입력하세요.');
    if (!draft.memberUids.includes(trip.ownerUid)) return setError('여행 소유자 UID는 공유 목록에서 제외할 수 없습니다.');
    if (draft.memberUids.length > 20) return setError('여행 하나에 최대 20개 계정을 등록할 수 있습니다.');
    try {
      await onSave({
        name: draft.name.trim(), start: draft.start, end: draft.end,
        purpose: draft.purpose.trim(),
        participants: draft.participants.map((person, index) => ({ ...person, name: names[index] })),
        memberUids: draft.memberUids,
      });
      onClose();
    } catch (saveError) { setError(saveError.message || '여행 정보를 저장하지 못했습니다. 권한과 네트워크를 확인해 주세요.'); }
  };

  return <div className="trip-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><form className="trip-modal trip-settings-modal" role="dialog" aria-modal="true" aria-labelledby="trip-settings-title" onSubmit={submit}>
    <header><div><span className="eyebrow">TRIP SETTINGS</span><h2 id="trip-settings-title">여행 정보</h2></div><button type="button" aria-label="닫기" onClick={onClose}><X/></button></header>
    <div className="trip-settings-scroll">
      <label>여행지 / 여행명<input maxLength="40" required value={draft.name} disabled={!owner} onChange={event => update('name', event.target.value)}/></label>
      <div className="trip-date-grid"><label>출발일<input type="date" required value={draft.start} disabled={!owner} onChange={event => update('start', event.target.value)}/></label><label>마지막 날<input type="date" min={draft.start} required value={draft.end} disabled={!owner} onChange={event => update('end', event.target.value)}/></label></div>
      <label>여행 목적 / 메모<textarea rows="3" maxLength="500" placeholder="예: 리조트에서 쉬며 호캉스" value={draft.purpose} disabled={!owner} onChange={event => update('purpose', event.target.value)}/></label>
      <section className="trip-form-section"><div className="trip-form-section-heading"><div><h3>여행자</h3><p>예산·정산에 사용하는 여행 인원입니다.</p></div>{owner && <button type="button" className="trip-secondary" onClick={addParticipant}>+ 인원 추가</button>}</div>
        {draft.participants.map((person, index) => <div className="trip-person-edit-row" key={person.id}><label><span>여행자 {index + 1}</span><input value={person.name} disabled={!owner} onChange={event => setParticipant(person.id, event.target.value)}/></label>{owner && draft.participants.length > 1 && <button type="button" aria-label={person.name ? person.name + ' 삭제' : '여행자 삭제'} onClick={() => removeParticipant(person.id)}><Trash2 size={16}/></button>}</div>)}
      </section>
      <section className="trip-form-section"><div className="trip-form-section-heading"><div><h3>여행 접근 UID</h3><p>등록한 Firebase 계정만 이 여행을 볼 수 있습니다. 공유할 사람은 먼저 가입한 뒤 UID를 보내야 합니다.</p></div></div>
        <div className="trip-own-uid"><span>내 Firebase UID</span><code>{trip.currentUid}</code><button type="button" className="trip-secondary" onClick={copyUid}>UID 복사</button></div>
        {owner && <div className="trip-share-uid-entry"><input aria-label="공유할 Firebase UID" placeholder="공유할 계정의 Firebase UID" value={newUid} onChange={event => setNewUid(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addUid(); } }}/><button type="button" className="trip-secondary" onClick={addUid}>UID 추가</button></div>}
        <ul className="trip-share-uid-list">{draft.memberUids.map(memberUid => <li key={memberUid}><code>{memberUid}</code><span>{memberUid === trip.ownerUid ? '소유자' : '여행자'}</span>{owner && memberUid !== trip.ownerUid && <button type="button" aria-label="공유 UID 삭제" onClick={() => update('memberUids', draft.memberUids.filter(uid => uid !== memberUid))}><X size={16}/></button>}</li>)}</ul>
      </section>
    </div>
    {message && <p className="trip-modal-message" role="status">{message}</p>}{error && <p className="trip-modal-message" role="alert">{error}</p>}
    <footer>{owner && <button type="button" className="trip-danger" disabled={busy} onClick={onDelete}><Trash2 size={16}/> 여행 삭제</button>}{owner && <button className="trip-primary" disabled={busy}>저장</button>}<button type="button" className="trip-secondary" onClick={onClose}>{owner ? '취소' : '닫기'}</button></footer>
  </form></div>;
}

const emptyFlight = () => ({ type: 'departure', airline: '', flightNumber: '', departure: { airport: '', date: '', time: '' }, arrival: { airport: '', date: '', time: '' }, duration: '' });

export function DashboardItemEditor({ type, item, onClose, onSave }) {
  const flight = type === 'flight';
  const [draft, setDraft] = useState(() => item ? structuredClone(item) : flight ? emptyFlight() : { name: '', location: '', checkIn: '', checkOut: '', imageUrl: '' });
  const [error, setError] = useState('');
  const set = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const setRoute = (end, key, value) => setDraft(previous => ({ ...previous, [end]: { ...previous[end], [key]: value } }));
  const submit = event => {
    event.preventDefault();
    const required = flight ? [draft.airline, draft.flightNumber, draft.departure.airport, draft.arrival.airport] : [draft.name, draft.location];
    if (required.some(value => !String(value || '').trim())) return setError('필수 항목을 입력해 주세요.');
    onSave({ ...draft, id: item?.id || crypto.randomUUID() });
    onClose();
  };
  return <div className="trip-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="trip-modal overview-editor" role="dialog" aria-modal="true" onSubmit={submit}>
    <header><div><span className="eyebrow">DASHBOARD</span><h2>{item ? '정보 수정' : '정보 추가'}</h2></div><button type="button" aria-label="닫기" onClick={onClose}><X/></button></header>
    {flight ? <>
      <label>항공사<input value={draft.airline} onChange={e => set('airline', e.target.value)} required/></label>
      <div className="trip-date-grid"><label>편명<input value={draft.flightNumber} onChange={e => set('flightNumber', e.target.value)} required/></label><label>구간<select value={draft.type} onChange={e => set('type', e.target.value)}><option value="departure">출국</option><option value="return">귀국</option></select></label></div>
      <h3><PlaneTakeoff size={17}/> 출발</h3><div className="trip-date-grid"><label>공항<input value={draft.departure.airport} onChange={e => setRoute('departure', 'airport', e.target.value)} required/></label><label>날짜<input value={draft.departure.date} placeholder="2027.03.04(목)" onChange={e => setRoute('departure', 'date', e.target.value)}/></label><label>시각<input type="time" value={draft.departure.time} onChange={e => setRoute('departure', 'time', e.target.value)}/></label></div>
      <h3><PlaneTakeoff size={17}/> 도착</h3><div className="trip-date-grid"><label>공항<input value={draft.arrival.airport} onChange={e => setRoute('arrival', 'airport', e.target.value)} required/></label><label>날짜<input value={draft.arrival.date} placeholder="2027.03.04(목)" onChange={e => setRoute('arrival', 'date', e.target.value)}/></label><label>시각<input type="time" value={draft.arrival.time} onChange={e => setRoute('arrival', 'time', e.target.value)}/></label></div>
      <label>비행 시간<input value={draft.duration} placeholder="3시간 50분 소요" onChange={e => set('duration', e.target.value)}/></label>
    </> : <>
      <label><Building2 size={16}/> 숙소명<input value={draft.name} onChange={e => set('name', e.target.value)} required/></label>
      <label>위치<input value={draft.location} onChange={e => set('location', e.target.value)} required/></label>
      <div className="trip-date-grid"><label>체크인<input value={draft.checkIn} placeholder="2027.03.04(목)" onChange={e => set('checkIn', e.target.value)}/></label><label>체크아웃<input value={draft.checkOut} placeholder="2027.03.05(금)" onChange={e => set('checkOut', e.target.value)}/></label></div>
      <label>숙소 이미지 주소 (선택)<input type="url" value={draft.imageUrl || ''} onChange={e => set('imageUrl', e.target.value)} placeholder="비워 두면 호텔 일러스트를 사용합니다."/></label>
    </>}
    {error && <p className="trip-modal-message" role="alert">{error}</p>}
    <footer><button type="button" className="trip-secondary" onClick={onClose}>취소</button><button className="trip-primary">저장</button></footer>
  </form></div>;
}
