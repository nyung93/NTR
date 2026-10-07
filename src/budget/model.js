export const CATEGORIES = ['항공', '숙소', '교통', '식비', '쇼핑', '스파', '기타'];
export const CURRENCIES = { KRW: 0, VND: 0, USD: 2, JPY: 0, EUR: 2 };
export const won = value => `${Math.round(value).toLocaleString('ko-KR')}원`;
export const money = (value, currency) => `${Number(value).toLocaleString('ko-KR', { maximumFractionDigits: CURRENCIES[currency] })} ${currency}`;
export function initialLedger(isNhaTrang) {
  return { budget: 0, people: [{ id: 'p1', name: isNhaTrang ? '민영' : '나' }, { id: 'p2', name: isNhaTrang ? '다미' : '동행자' }], expenses: [], exchanges: [], transfers: [] };
}
export function amount(value, currency = 'KRW', allowZero = false) {
  if (!(currency in CURRENCIES)) throw Error('지원하지 않는 통화입니다.');
  const text = String(value).trim();
  const places = CURRENCIES[currency];
  if (!(places ? /^\d+(\.\d{1,2})?$/ : /^\d+$/).test(text)) throw Error(`${currency} 금액을 ${places ? '소수점 둘째 자리까지' : '정수로'} 입력하세요.`);
  const number = Number(text);
  if (!Number.isFinite(number) || number > 1e12 || (allowZero ? number < 0 : number <= 0)) throw Error('금액은 0보다 크고 1조 이하여야 합니다.');
  return number;
}
export const minor = (value, currency) => Math.round(value * (10 ** CURRENCIES[currency]));
function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw Error('올바른 날짜를 입력하세요.');
}
function person(ledger, id) { if (!ledger.people.some(p => p.id === id)) throw Error('참여자를 선택하세요.'); }
export function cashRemaining(ledger, exchange, excludeId) {
  const spent = ledger.expenses.filter(e => e.id !== excludeId && e.exchangeId === exchange.id && e.status === 'paid').reduce((sum, e) => sum + minor(e.amount, e.currency), 0);
  return (minor(exchange.foreign, exchange.currency) - spent) / (10 ** CURRENCIES[exchange.currency]);
}
export function normalizeExchange(input, ledger) {
  validDate(input.date); person(ledger, input.owner);
  if (input.currency === 'KRW') throw Error('환전 받을 외화를 선택하세요.');
  if (input.id && ledger.expenses.some(e => e.exchangeId === input.id)) throw Error('연결된 지출이 있어 환전을 수정할 수 없습니다. 지출에서 환전 연결을 먼저 해제하세요.');
  return { id: input.id || crypto.randomUUID(), date: input.date, owner: input.owner, currency: input.currency, foreign: amount(input.foreign, input.currency), krw: amount(input.krw), note: input.note.trim() };
}
export function normalizeExpense(input, ledger) {
  if (!input.title.trim()) throw Error('항목명을 입력하세요.');
  validDate(input.date);
  if (!CATEGORIES.includes(input.category) || !['planned', 'paid'].includes(input.status)) throw Error('분류와 상태를 확인하세요.');
  const value = amount(input.amount, input.currency);
  let payer = input.payer;
  let krw = input.currency === 'KRW' ? value : amount(input.krw);
  const exchange = input.exchangeId ? ledger.exchanges.find(x => x.id === input.exchangeId) : null;
  if (input.exchangeId && (!exchange || input.method !== 'cash' || exchange.currency !== input.currency)) throw Error('현금 통화와 환전 내역을 확인하세요.');
  if (exchange) {
    payer = exchange.owner;
    if (input.status === 'paid' && minor(value, input.currency) > minor(cashRemaining(ledger, exchange, input.id), input.currency)) throw Error('해당 환전의 남은 현금보다 큰 금액입니다.');
  }
  person(ledger, payer);
  if (!['card', 'cash', 'bank'].includes(input.method)) throw Error('결제 수단을 확인하세요.');
  const members = ledger.people.filter(p => input.members.includes(p.id));
  if (!members.length) throw Error('분담 대상을 한 명 이상 선택하세요.');
  const shares = {};
  if (input.split === 'equal') {
    const base = Math.floor(krw / members.length);
    members.forEach((p, index) => { shares[p.id] = base + (index < krw % members.length ? 1 : 0); });
  } else if (input.split === 'custom') {
    members.forEach(p => { shares[p.id] = amount(input.custom[p.id] || '0', 'KRW', true); });
    if (Object.values(shares).reduce((sum, n) => sum + n, 0) !== krw) throw Error('직접 입력한 분담금의 합계가 원화 정산액과 같아야 합니다.');
  } else throw Error('분담 방식을 선택하세요.');
  return { id: input.id || crypto.randomUUID(), title: input.title.trim(), date: input.date, category: input.category, status: input.status, amount: value, currency: input.currency, krw, payer, method: input.method, exchangeId: exchange?.id || '', shares, split: input.split, note: input.note.trim() };
}
export function normalizeTransfer(input, ledger) {
  person(ledger, input.from); person(ledger, input.to); validDate(input.date);
  if (input.from === input.to) throw Error('보내는 사람과 받는 사람을 다르게 선택하세요.');
  return { id: input.id || crypto.randomUUID(), date: input.date, from: input.from, to: input.to, krw: amount(input.krw), note: input.note.trim() };
}
export function summarize(ledger) {
  const rows = ledger.people.map(p => ({ ...p, paid: 0, owed: 0, sent: 0, received: 0, balance: 0 }));
  const byId = Object.fromEntries(rows.map(p => [p.id, p]));
  const categories = Object.fromEntries(CATEGORIES.map(c => [c, { paid: 0, planned: 0 }]));
  let paid = 0, planned = 0;
  ledger.expenses.forEach(e => {
    categories[e.category][e.status] += e.krw;
    if (e.status === 'planned') { planned += e.krw; return; }
    paid += e.krw;
    byId[e.payer].paid += e.krw;
    Object.entries(e.shares).forEach(([id, value]) => { byId[id].owed += value; });
  });
  ledger.transfers.forEach(t => { byId[t.from].sent += t.krw; byId[t.to].received += t.krw; });
  rows.forEach(p => { p.balance = p.paid - p.owed + p.sent - p.received; });
  const creditors = rows.filter(p => p.balance > 0).map(p => ({ id: p.id, left: p.balance }));
  const debtors = rows.filter(p => p.balance < 0).map(p => ({ id: p.id, left: -p.balance }));
  const settlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const value = Math.min(debtors[i].left, creditors[j].left);
    settlements.push({ from: debtors[i].id, to: creditors[j].id, krw: value });
    debtors[i].left -= value; creditors[j].left -= value;
    if (!debtors[i].left) i++;
    if (!creditors[j].left) j++;
  }
  return { paid, planned, remaining: ledger.budget - paid - planned, rows, categories, settlements };
}
