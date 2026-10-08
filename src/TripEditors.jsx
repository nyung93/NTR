import React, { useState } from 'react';
import { CalendarDays, PlaneTakeoff, Building2, Trash2, X } from 'lucide-react';

export function TripSettingsDialog({ trip, onClose, onSave, onDelete, busy }) {
  const [draft, setDraft] = useState({ name: trip.name, start: trip.start, end: trip.end });
  const [error, setError] = useState('');
  const update = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    if (!draft.name.trim() || Date.parse(draft.end) < Date.parse(draft.start)) return setError('여행지 이름과 여행 기간을 확인해 주세요.');
    try { await onSave({ name: draft.name.trim(), start: draft.start, end: draft.end }); onClose(); }
    catch { setError('여행 정보를 저장하지 못했습니다. 권한과 네트워크를 확인해 주세요.'); }
  };
  return <div className="trip-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="trip-modal" role="dialog" aria-modal="true" onSubmit={submit}>
    <header><div><span className="eyebrow">TRIP SETTINGS</span><h2>여행 정보</h2></div><button type="button" aria-label="닫기" onClick={onClose}><X/></button></header>
    <label>여행지<input maxLength="40" required value={draft.name} onChange={e => update('name', e.target.value)}/></label>
    <div className="trip-date-grid"><label>출발일<input type="date" required value={draft.start} onChange={e => update('start', e.target.value)}/></label><label>마지막 날<input type="date" min={draft.start} required value={draft.end} onChange={e => update('end', e.target.value)}/></label></div>
    {error && <p className="trip-modal-message" role="alert">{error}</p>}
    <footer>{trip.ownerUid === trip.currentUid && <button type="button" className="trip-danger" disabled={busy} onClick={onDelete}><Trash2 size={16}/> 여행 삭제</button>}<button className="trip-primary" disabled={busy}>저장</button></footer>
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
