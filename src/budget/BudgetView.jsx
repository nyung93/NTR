import React, { useEffect, useRef, useState } from 'react';
import { Wallet, Plus, X, ArrowRight, Copy, Pencil, Trash2, Download } from 'lucide-react';
import { CATEGORIES, CURRENCIES, won, money, amount, cashRemaining, normalizeExpense, normalizeExchange, normalizeTransfer, summarize } from './model';
import './budget.css';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const methods = { card: '카드', cash: '현금', bank: '계좌이체' };
function Dialog({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="budget-dialog" aria-label={title} onCancel={e => { e.preventDefault(); close(); }}>
    <div className="budget-dialog-heading"><h2>{title}</h2><button type="button" aria-label="닫기" onClick={close}><X size={22}/></button></div>{children}
  </dialog>;
}
const NumberField = ({ label, value, change, currency = 'KRW', ...props }) => <label>{label}<input aria-label={label} type="number" inputMode={CURRENCIES[currency] ? 'decimal' : 'numeric'} step={CURRENCIES[currency] ? '.01' : '1'} min="0" max="1000000000000" required value={value} onChange={e => change(e.target.value)} {...props}/></label>;
const PersonSelect = ({ label, value, change, people, disabled = false }) => <label>{label}<select aria-label={label} value={value} onChange={e => change(e.target.value)} disabled={disabled}>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>;
const CurrencySelect = ({ value, change, foreign = false }) => <label>통화<select aria-label="통화" value={value} onChange={e => change(e.target.value)}>{Object.keys(CURRENCIES).filter(c => !foreign || c !== 'KRW').map(c => <option key={c}>{c}</option>)}</select></label>;
function FormActions({ close, label = '저장' }) { return <div className="budget-form-actions"><button type="button" onClick={close}>취소</button><button type="submit" className="budget-primary">{label}</button></div>; }

function ExpenseEditor({ ledger, item, save, close }) {
  const [draft, setDraft] = useState(() => item ? { ...item, members: Object.keys(item.shares), custom: item.shares } : { title: '', date: today(), category: '기타', status: 'paid', amount: '', currency: 'KRW', krw: '', payer: ledger.people[0].id, method: 'card', exchangeId: '', members: ledger.people.map(p => p.id), split: 'equal', custom: {}, note: '' });
  const [error, setError] = useState('');
  const update = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const exchange = ledger.exchanges.find(x => x.id === draft.exchangeId);
  const [manualKrw, setManualKrw] = useState(Boolean(item));
  const automaticKrw = exchange && Number(draft.amount) > 0 ? Math.round(Number(draft.amount) * exchange.krw / exchange.foreign) : '';
  const krw = draft.currency === 'KRW' ? draft.amount : exchange && !manualKrw ? automaticKrw : draft.krw;
  const submit = e => {
    e.preventDefault();
    try { const expense = normalizeExpense({ ...draft, krw: String(krw) }, ledger); if (save(expense)) close(); } catch (err) { setError(err.message); }
  };
  return <Dialog title={item ? '지출 수정' : '지출 추가'} close={close}><form onSubmit={submit}>
    <label>항목명<input autoFocus required maxLength={100} placeholder="예: 퓨전 리조트 예약금" value={draft.title} onChange={e => update('title', e.target.value)}/></label>
    <div className="budget-form-grid"><label>날짜<input aria-label="날짜" type="date" required value={draft.date} onChange={e => update('date', e.target.value)}/></label><label>상태<select aria-label="상태" value={draft.status} onChange={e => update('status', e.target.value)}><option value="paid">결제 완료</option><option value="planned">지출 예정</option></select></label><label>분류<select aria-label="분류" value={draft.category} onChange={e => update('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label>결제 수단<select aria-label="결제 수단" value={draft.method} onChange={e => setDraft(p => ({ ...p, method: e.target.value, exchangeId: '' }))}>{Object.entries(methods).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
    <div className="budget-form-grid"><NumberField label="금액" value={draft.amount} currency={draft.currency} change={v => update('amount', v)}/><CurrencySelect value={draft.currency} change={v => { setDraft(p => ({ ...p, currency: v, exchangeId: '', krw: '' })); setManualKrw(false); }}/></div>
    {draft.method === 'cash' && draft.currency !== 'KRW' && <label>환전 내역 연결<select aria-label="환전 내역 연결" value={draft.exchangeId} onChange={e => { update('exchangeId', e.target.value); setManualKrw(false); }}><option value="">연결 안 함 · 원화 직접 입력</option>{ledger.exchanges.filter(x => x.currency === draft.currency).map(x => <option key={x.id} value={x.id}>{x.date} · {ledger.people.find(p => p.id === x.owner)?.name} · 잔액 {money(cashRemaining(ledger, x, item?.id), x.currency)}</option>)}</select></label>}
    {draft.currency !== 'KRW' && <><NumberField label="원화 정산액 (KRW)" value={krw} change={v => { setManualKrw(true); update('krw', v); }}/><p className="budget-help">{exchange ? '환전 비율로 자동 계산합니다. 수정한 원화 금액은 그대로 저장됩니다.' : '카드는 실제 원화 청구액을 입력하세요. 예정 내역은 예상 원화 금액을 입력하세요.'}</p></>}
    <PersonSelect label="결제자" value={exchange?.owner || draft.payer} change={v => update('payer', v)} people={ledger.people} disabled={Boolean(exchange)}/>
    {exchange && <p className="budget-help">연결한 현금의 원화 부담자에게 결제 금액이 반영됩니다. 환전 원금은 지출에 중복 합산하지 않습니다.</p>}
    <fieldset><legend>분담 대상</legend><p className="budget-help">공동 지출은 함께 부담할 사람을, 개인 지출은 한 명만 선택하세요.</p><div className="budget-checks">{ledger.people.map(p => <label key={p.id}><input type="checkbox" checked={draft.members.includes(p.id)} onChange={e => update('members', e.target.checked ? [...draft.members, p.id] : draft.members.filter(id => id !== p.id))}/>{p.name}</label>)}</div></fieldset>
    <label>분담 방식<select aria-label="분담 방식" value={draft.split} onChange={e => update('split', e.target.value)}><option value="equal">균등 분할</option><option value="custom">원화 금액 직접 지정</option></select></label>
    {draft.split === 'custom' && <div className="budget-form-grid">{ledger.people.filter(p => draft.members.includes(p.id)).map(p => <NumberField key={p.id} label={`${p.name} 부담액 (원)`} value={draft.custom[p.id] ?? ''} change={v => update('custom', { ...draft.custom, [p.id]: v })}/>)}</div>}
    <p className="budget-help">원화 정산액 {won(Number(krw) || 0)} · 균등 분할 시 남는 1원은 참여자 순서대로 배분합니다.</p>
    <label>메모<textarea maxLength={500} value={draft.note} onChange={e => update('note', e.target.value)} placeholder="예약금·잔금은 별도 항목으로 기록하세요."/></label>
    {error && <p role="alert" className="budget-error">{error}</p>}<FormActions close={close}/>
  </form></Dialog>;
}

function ExchangeEditor({ ledger, item, save, close }) {
  const [draft, setDraft] = useState(item || { date: today(), owner: ledger.people[0].id, currency: 'VND', foreign: '', krw: '', note: '' });
  const [error, setError] = useState('');
  const update = (key, value) => setDraft(p => ({ ...p, [key]: value }));
  return <Dialog title={item ? '환전 수정' : '환전 추가'} close={close}><form onSubmit={e => { e.preventDefault(); try { if (save(normalizeExchange(draft, ledger))) close(); } catch (err) { setError(err.message); } }}>
    <p className="budget-help">환전은 지출이 아닙니다. 현금 사용 내역을 연결하면 실제 사용액만 예산과 정산에 반영됩니다.</p>
    <label>환전일<input autoFocus type="date" required value={draft.date} onChange={e => update('date', e.target.value)}/></label><PersonSelect label="원화 부담자" value={draft.owner} change={v => update('owner', v)} people={ledger.people}/>
    <NumberField label="투입 원화 (KRW)" value={draft.krw} change={v => update('krw', v)}/><div className="budget-form-grid"><NumberField label="받은 외화" currency={draft.currency} value={draft.foreign} change={v => update('foreign', v)}/><CurrencySelect foreign value={draft.currency} change={v => update('currency', v)}/></div>
    <p className="budget-help">환율: 1 {draft.currency} ≈ {Number(draft.foreign) > 0 ? (Number(draft.krw) / Number(draft.foreign)).toLocaleString('ko-KR', { maximumFractionDigits: 6 }) : '—'}원. 별도 수수료는 지출에 기록하세요.</p>
    <label>메모<textarea maxLength={500} value={draft.note} onChange={e => update('note', e.target.value)}/></label>{error && <p role="alert" className="budget-error">{error}</p>}<FormActions close={close}/>
  </form></Dialog>;
}
function TransferEditor({ ledger, item, save, close }) {
  const [draft, setDraft] = useState({ date: today(), from: ledger.people[0].id, to: ledger.people[1]?.id || ledger.people[0].id, krw: '', note: '', ...item });
  const [error, setError] = useState('');
  const update = (key, value) => setDraft(p => ({ ...p, [key]: value }));
  return <Dialog title="정산 송금 기록" close={close}><form onSubmit={e => { e.preventDefault(); try { if (save(normalizeTransfer(draft, ledger))) close(); } catch (err) { setError(err.message); } }}>
    <p className="budget-help">실제로 송금한 금액만 기록하세요. 앱에서 송금되지는 않습니다.</p><label>송금일<input autoFocus required type="date" value={draft.date} onChange={e => update('date', e.target.value)}/></label>
    <div className="budget-form-grid"><PersonSelect label="보내는 사람" value={draft.from} change={v => update('from', v)} people={ledger.people}/><PersonSelect label="받는 사람" value={draft.to} change={v => update('to', v)} people={ledger.people}/></div>
    <NumberField label="송금액 (KRW)" value={draft.krw} change={v => update('krw', v)}/><label>메모<textarea maxLength={500} value={draft.note} onChange={e => update('note', e.target.value)}/></label>{error && <p role="alert" className="budget-error">{error}</p>}<FormActions close={close} label="송금 기록 저장"/>
  </form></Dialog>;
}
function SettingsEditor({ ledger, save, close }) {
  const [budget, setBudget] = useState(String(ledger.budget));
  const [people, setPeople] = useState(ledger.people.map(p => ({ ...p })));
  const [error, setError] = useState('');
  const referenced = id => ledger.expenses.some(e => e.payer === id || id in e.shares) || ledger.exchanges.some(x => x.owner === id) || ledger.transfers.some(t => t.from === id || t.to === id);
  return <Dialog title="예산·참여자 설정" close={close}><form onSubmit={e => { e.preventDefault(); try { const total = amount(budget, 'KRW', true); const names = people.map(p => p.name.trim()); if (!names.length || names.some(n => !n) || new Set(names).size !== names.length) throw Error('참여자 이름을 빈칸이나 중복 없이 입력하세요.'); if (save({ ...ledger, budget: total, people: people.map((p, i) => ({ ...p, name: names[i] })) })) close(); } catch (err) { setError(err.message); } }}>
    <NumberField label="전체 여행 예산 (원)" autoFocus value={budget} change={setBudget}/><p className="budget-help">0원은 예산 미설정으로 표시합니다. 예산에는 실제 지출과 예정 금액을 함께 반영합니다.</p><fieldset><legend>여행 참여자</legend>{people.map((p, index) => <div className="budget-person-edit" key={p.id}><label>참여자 {index + 1}<input required maxLength={24} value={p.name} onChange={e => setPeople(previous => previous.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}/></label><button type="button" disabled={people.length === 1 || referenced(p.id)} onClick={() => setPeople(previous => previous.filter(x => x.id !== p.id))} aria-label={`${p.name || '참여자'} 삭제`}><Trash2 size={18}/></button></div>)}<button type="button" className="budget-secondary" disabled={people.length >= 20} onClick={() => setPeople(p => [...p, { id: crypto.randomUUID(), name: '' }])}>+ 참여자 추가</button><p className="budget-help">지출·환전·송금 기록에 사용된 참여자는 삭제할 수 없습니다.</p></fieldset>{error && <p role="alert" className="budget-error">{error}</p>}<FormActions close={close}/>
  </form></Dialog>;
}

export default function BudgetView({ trip, ledger, setLedger, syncStatus, syncError }) {
  const [error, setError] = useState('');
  const [section, setSection] = useState('expenses');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  if (syncStatus === 'loading') return <div className="budget-view"><p className="budget-local-note">예산 데이터를 Firebase에서 불러오는 중…</p></div>;
  const summary = summarize(ledger);
  const name = id => ledger.people.find(p => p.id === id)?.name || '참여자';
  const commit = next => {
    if (syncError) { setError(syncError); return false; }
    setLedger(next); setError(''); return true;
  };
  const upsert = (kind, item) => commit({ ...ledger, [kind]: ledger[kind].some(x => x.id === item.id) ? ledger[kind].map(x => x.id === item.id ? item : x) : [...ledger[kind], item] });
  const close = () => setModal(null);
  const remove = (kind, item) => {
    if (kind === 'exchanges' && ledger.expenses.some(e => e.exchangeId === item.id)) { setNotice('연결된 지출의 환전 연결을 먼저 해제하세요.'); return; }
    setModal({ type: 'delete', kind, item });
  };
  const report = [`${trip.name} 예산·정산`, `실제 지출 ${won(summary.paid)} / 예정 ${won(summary.planned)}`, ...summary.rows.map(p => `${p.name}: 결제 ${won(p.paid)}, 부담 ${won(p.owed)}, 송금 ${won(p.sent)}, 수령 ${won(p.received)}`), ...summary.settlements.map(s => `${name(s.from)} → ${name(s.to)} ${won(s.krw)}`), ...(summary.settlements.length ? [] : ['남은 정산액 없음']), '결제 완료 내역과 기록된 송금 기준 · 예정 지출/미사용 환전 제외'].join('\n');
  const exportCsv = () => {
    const quote = value => `"${String(value).replace(/^[=+@\-]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [['날짜', '항목', '분류', '상태', '금액', '통화', '원화 정산액', '결제자', '결제 수단', '분담', '메모'], ...ledger.expenses.map(e => [e.date, e.title, e.category, e.status === 'paid' ? '결제 완료' : '지출 예정', e.amount, e.currency, e.krw, name(e.payer), methods[e.method], Object.entries(e.shares).map(([id, v]) => `${name(id)} ${won(v)}`).join(' / '), e.note])];
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `${trip.name}-지출.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const visible = ledger.expenses.filter(e => (filter === 'all' || e.status === filter) && (category === 'all' || e.category === category)).sort((a, b) => b.date.localeCompare(a.date));
  return <div className="budget-view">
    <div className="budget-toolbar"><div><h2><Wallet size={22}/> 예산·정산</h2><p>여행별 지출, 환전, 정산을 한곳에서 관리합니다.</p></div><button className="budget-secondary" onClick={() => setModal({ type: 'settings' })}>예산·참여자 설정</button></div>
    <p className="budget-local-note">{syncError || (syncStatus === 'ready' ? 'Firebase 계정에 저장되어 함께 여행하는 사람과 공유됩니다.' : 'Firebase에 연결 중…')}</p>
    {error && <p role="alert" className="budget-error">{error}</p>}{notice && <p role="status" className="budget-notice">{notice}<button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={16}/></button></p>}
    <div className="budget-summary">{[['전체 예산', ledger.budget ? won(ledger.budget) : '미설정'], ['실제 지출', won(summary.paid)], ['앞으로 쓸 금액', won(summary.planned)], ['예정 포함 남은 예산', ledger.budget ? won(summary.remaining) : '예산을 설정하세요']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    {ledger.budget > 0 && summary.remaining < 0 && <p className="budget-error">예정 금액까지 포함하면 예산을 {won(-summary.remaining)} 초과합니다.</p>}
    <div className="budget-sections" role="group" aria-label="예산 메뉴">{[['expenses', '지출·예정'], ['exchange', '환전·현금'], ['settlement', '정산']].map(([id, label]) => <button key={id} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>)}</div>
    {section === 'expenses' && <>
      <div className="budget-category-grid">{CATEGORIES.map(c => <div key={c}><span>{c}</span><strong>{won(summary.categories[c].paid)}</strong><small>예정 {won(summary.categories[c].planned)}</small></div>)}</div>
      <div className="budget-actions"><div className="budget-filters"><label>상태 필터<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">전체 상태</option><option value="paid">결제 완료</option><option value="planned">지출 예정</option></select></label><label>분류 필터<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">전체 분류</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label></div><button className="budget-secondary" onClick={exportCsv}><Download size={16}/> CSV 내보내기</button><button className="budget-primary" onClick={() => setModal({ type: 'expense' })}><Plus size={18}/> 지출 추가</button></div>
      {!visible.length && <div className="budget-empty">표시할 지출이 없습니다. 항공권·호텔 예약금부터 입력해 보세요.</div>}
      <div className="budget-list">{visible.map(e => <article className="budget-record" key={e.id}><div className="budget-record-top"><div><span className={`budget-status ${e.status}`}>{e.status === 'paid' ? '결제 완료' : '지출 예정'}</span><span className="budget-category">{e.category} · {e.date}</span><h3>{e.title}</h3></div><div className="budget-record-amount"><strong>{won(e.krw)}</strong>{e.currency !== 'KRW' && <span>{money(e.amount, e.currency)}</span>}</div></div><p>{name(e.payer)} 결제 · {methods[e.method]}{e.exchangeId ? ' · 환전 현금 연결' : ''}</p><p>분담: {Object.entries(e.shares).map(([id, v]) => `${name(id)} ${won(v)}`).join(' / ')}</p>{e.note && <p className="budget-record-note">{e.note}</p>}<div className="budget-row-actions">{e.status === 'planned' && <button onClick={() => setModal({ type: 'expense', item: { ...e, status: 'paid' } })}>결제 완료로 변경</button>}<button aria-label={`${e.title} 수정`} onClick={() => setModal({ type: 'expense', item: e })}><Pencil size={15}/> 수정</button><button aria-label={`${e.title} 삭제`} onClick={() => remove('expenses', e)}><Trash2 size={15}/> 삭제</button></div></article>)}</div>
    </>}
    {section === 'exchange' && <><div className="budget-actions"><p className="budget-help">환전 원금은 예산·정산에서 제외됩니다. 연결된 결제 완료 지출만 현금 잔액에서 차감합니다.</p><button className="budget-primary" onClick={() => setModal({ type: 'exchange' })}><Plus size={18}/> 환전 추가</button></div>{!ledger.exchanges.length && <div className="budget-empty">환전한 원화와 받은 외화를 기록하세요.</div>}<div className="budget-list">{ledger.exchanges.map(x => <article className="budget-record" key={x.id}><div className="budget-record-top"><div><span className="budget-category">{x.date} · 원화 부담자 {name(x.owner)}</span><h3>{won(x.krw)} → {money(x.foreign, x.currency)}</h3></div><span className="budget-status planned">환전</span></div><p>남은 현금 <strong>{money(cashRemaining(ledger, x), x.currency)}</strong></p><p>1 {x.currency} ≈ {(x.krw / x.foreign).toLocaleString('ko-KR', { maximumFractionDigits: 6 })}원</p>{x.note && <p>{x.note}</p>}<div className="budget-row-actions"><button onClick={() => ledger.expenses.some(e => e.exchangeId === x.id) ? setNotice('연결된 지출의 환전 연결을 먼저 해제한 뒤 수정하세요.') : setModal({ type: 'exchange', item: x })}><Pencil size={15}/> 수정</button><button onClick={() => remove('exchanges', x)}><Trash2 size={15}/> 삭제</button></div></article>)}</div></>}
    {section === 'settlement' && <><div className="budget-actions"><p className="budget-help">결제 완료 지출에서 각자 부담액을 계산하고, 기록된 송금을 반영합니다.</p><button className="budget-secondary" onClick={async () => { try { await navigator.clipboard.writeText(report); setNotice('정산 결과를 복사했습니다.'); } catch { setModal({ type: 'report' }); } }}><Copy size={16}/> 정산 결과 복사</button><button className="budget-primary" onClick={() => setModal({ type: 'transfer' })}>송금 기록</button></div><div className="budget-people">{summary.rows.map(p => <article key={p.id}><h3>{p.name}</h3><dl><div><dt>결제한 금액</dt><dd>{won(p.paid)}</dd></div><div><dt>부담할 금액</dt><dd>{won(p.owed)}</dd></div><div><dt>송금 / 수령</dt><dd>{won(p.sent)} / {won(p.received)}</dd></div><div className="budget-person-balance"><dt>{p.balance > 0 ? '받을 돈' : p.balance < 0 ? '보낼 돈' : '남은 정산액'}</dt><dd>{won(Math.abs(p.balance))}</dd></div></dl></article>)}</div><h3 className="budget-subheading">남은 정산</h3>{!summary.settlements.length ? <p className="budget-empty">현재 남은 정산 금액이 없습니다.</p> : summary.settlements.map((s, i) => <div className="budget-settlement" key={i}><span>{name(s.from)} <ArrowRight size={17}/> {name(s.to)}</span><strong>{won(s.krw)}</strong><button onClick={() => setModal({ type: 'transfer', item: s })}>송금 기록하기</button></div>)}<h3 className="budget-subheading">송금 내역</h3>{!ledger.transfers.length && <p className="budget-help">아직 기록된 송금이 없습니다.</p>}{ledger.transfers.map(t => <article className="budget-record" key={t.id}><h3>{name(t.from)} → {name(t.to)} · {won(t.krw)}</h3><p>{t.date}{t.note && ` · ${t.note}`}</p><div className="budget-row-actions"><button onClick={() => setModal({ type: 'transfer', item: t })}>수정</button><button onClick={() => remove('transfers', t)}>삭제</button></div></article>)}</>}
    {modal?.type === 'expense' && <ExpenseEditor ledger={ledger} item={modal.item} save={item => upsert('expenses', item)} close={close}/>}
    {modal?.type === 'exchange' && <ExchangeEditor ledger={ledger} item={modal.item} save={item => upsert('exchanges', item)} close={close}/>}
    {modal?.type === 'transfer' && <TransferEditor ledger={ledger} item={modal.item} save={item => upsert('transfers', item)} close={close}/>}
    {modal?.type === 'settings' && <SettingsEditor ledger={ledger} save={commit} close={close}/>}
    {modal?.type === 'delete' && <Dialog title="내역 삭제" close={close}><p>이 내역을 삭제하면 예산과 정산 금액이 다시 계산됩니다.</p><div className="budget-form-actions"><button onClick={close}>취소</button><button className="budget-primary" onClick={() => { if (commit({ ...ledger, [modal.kind]: ledger[modal.kind].filter(x => x.id !== modal.item.id) })) close(); }}>삭제하기</button></div></Dialog>}
    {modal?.type === 'report' && <Dialog title="정산 결과 공유" close={close}><p className="budget-help">아래 내용을 선택해 복사하세요.</p><textarea className="budget-report" readOnly aria-label="정산 결과" value={report} onFocus={e => e.target.select()}/></Dialog>}
  </div>;
}
