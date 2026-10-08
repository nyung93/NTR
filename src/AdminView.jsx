import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, RefreshCw, Users, MapPin, X } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const invoke = name => httpsCallable(functions, name);
const dateText = value => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '기록 없음';

export default function AdminView({ onBack }) {
  const [data, setData] = useState({ members: [], trips: [] });
  const [tab, setTab] = useState('members');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tripDetails, setTripDetails] = useState(null);

  async function refresh() {
    setLoading(true); setError('');
    try { const result = await invoke('getAdminDashboard')(); setData(result.data); }
    catch (failure) {
      setError(failure.code === 'functions/permission-denied' ? '관리자 권한이 없습니다. Firebase 관리자 권한을 받은 계정으로 다시 로그인해 주세요.' : '관리자 데이터를 불러오지 못했습니다. Firebase Functions가 배포됐는지 확인해 주세요.');
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  async function viewTrip(tripId) {
    setTripDetails({ loading: true });
    try { const result = await invoke('getAdminTripDetails')({ tripId }); setTripDetails(result.data); }
    catch { setTripDetails({ error: '여행 정보를 열지 못했습니다.' }); }
  }

  const filteredMembers = data.members.filter(member => `${member.email} ${member.displayName}`.toLowerCase().includes(query.toLowerCase()));
  const filteredTrips = data.trips.filter(trip => `${trip.name} ${trip.ownerEmail}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-view">
    <header className="admin-heading"><div><span className="eyebrow">ADMINISTRATION</span><h2>관리자</h2><p>회원 계정과 생성된 여행을 조회합니다. 여행 상세 조회는 기록됩니다.</p></div><div><button className="trip-secondary" onClick={refresh} disabled={loading}><RefreshCw size={16}/> 새로고침</button><button className="trip-secondary" onClick={onBack}><ArrowLeft size={16}/> 여행으로</button></div></header>
    <div className="admin-tabs"><button aria-pressed={tab === 'members'} onClick={() => { setTab('members'); setQuery(''); }}><Users size={17}/> 회원 {data.members.length}</button><button aria-pressed={tab === 'trips'} onClick={() => { setTab('trips'); setQuery(''); }}><MapPin size={17}/> 여행 {data.trips.length}</button></div>
    <label className="admin-search">검색<input value={query} onChange={e => setQuery(e.target.value)} placeholder={tab === 'members' ? '이메일 또는 이름' : '여행지 또는 생성자'}/></label>
    {error && <p className="admin-error" role="alert">{error}</p>}{loading && <p className="admin-loading">관리자 정보를 불러오는 중…</p>}
    {!loading && !error && tab === 'members' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>회원</th><th>가입일</th><th>최근 로그인</th><th>최근 앱 접속</th></tr></thead><tbody>{filteredMembers.map(member => <tr key={member.uid}><td><strong>{member.displayName || member.email || member.uid}</strong><small>{member.email}</small>{member.disabled && <small>비활성 계정</small>}</td><td>{dateText(member.createdAt)}</td><td>{dateText(member.lastSignInAt)}</td><td>{dateText(member.lastAccessAt)}</td></tr>)}{!filteredMembers.length && <tr><td colSpan="4">회원이 없습니다.</td></tr>}</tbody></table></div>}
    {!loading && !error && tab === 'trips' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>여행지</th><th>생성일</th><th>생성자</th><th>인원</th><th></th></tr></thead><tbody>{filteredTrips.map(trip => <tr key={trip.id}><td><strong>{trip.name}</strong><small>{trip.start} — {trip.end}</small></td><td>{dateText(trip.createdAt)}</td><td>{trip.ownerEmail || trip.ownerUid}</td><td>{trip.memberCount}</td><td><button className="admin-view-trip" onClick={() => viewTrip(trip.id)}><Eye size={16}/> 보기</button></td></tr>)}{!filteredTrips.length && <tr><td colSpan="5">등록된 여행이 없습니다.</td></tr>}</tbody></table></div>}
    {tripDetails && <div className="trip-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setTripDetails(null); }}><section className="trip-modal admin-trip-details" role="dialog" aria-modal="true"><header><div><span className="eyebrow">READ ONLY · ADMIN VIEW LOGGED</span><h2>{tripDetails.trip?.name || (tripDetails.loading ? '불러오는 중…' : '여행 정보')}</h2></div><button onClick={() => setTripDetails(null)} aria-label="닫기"><X/></button></header>{tripDetails.error && <p className="admin-error">{tripDetails.error}</p>}{tripDetails.trip && <><p>생성자 {tripDetails.trip.ownerEmail || tripDetails.trip.ownerUid} · {dateText(tripDetails.trip.createdAt)}</p><h3>일정</h3><pre>{JSON.stringify(tripDetails.sections?.itinerary || {}, null, 2)}</pre><h3>항공편·숙소</h3><pre>{JSON.stringify(tripDetails.sections?.overview || {}, null, 2)}</pre><h3>예산</h3><p>지출 {tripDetails.sections?.budget?.expenses?.length || 0}건 · 환전 {tripDetails.sections?.budget?.exchanges?.length || 0}건</p></>}</section></div>}
  </section>;
}
