import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import './auth.css';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, async user => {
    if (!user) { setSession(null); return; }
    setSession(user);
  }), []);
  if (session === undefined) return <main className="auth-screen"><p>Firebase 연결 확인 중…</p></main>;
  if (!session) return <SignIn />;
  return children(session);
}

function SignIn() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, email.trim(), password);
      else if (mode === 'reset') {
        auth.languageCode = 'ko';
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('요청을 처리했습니다. 가입된 이메일이면 재설정 링크가 전송됩니다. 받은편지함과 스팸함을 확인해 주세요.');
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const messages = {
        'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
        'auth/invalid-credential': '이메일 또는 비밀번호를 확인해 주세요.',
        'auth/weak-password': '비밀번호는 12자 이상 입력해 주세요.',
        'auth/invalid-email': '이메일 주소 형식을 확인해 주세요.',
        'auth/too-many-requests': '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
        'auth/operation-not-allowed': 'Firebase 콘솔에서 이메일/비밀번호 로그인을 사용 설정해 주세요.',
        'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
        'auth/user-not-found': '해당 이메일로 가입된 계정을 찾지 못했습니다.',
        'auth/unauthorized-continue-uri': 'Firebase 인증 설정에 현재 사이트 주소가 허용되어 있는지 확인해 주세요.',
        'auth/unauthorized-domain': 'Firebase Authentication의 승인된 도메인에 현재 사이트 주소를 추가해 주세요.',
        'auth/invalid-continue-uri': 'Firebase 비밀번호 재설정 링크 설정을 확인해 주세요.',
      };
      setMessage(messages[error.code] || `요청에 실패했습니다. Firebase 오류 코드: ${error.code || 'unknown'}.`);
    } finally { setBusy(false); }
  }

  const reset = mode === 'reset';
  return <main className="auth-screen">
    <form className="auth-card" onSubmit={submit}>
      <span className="auth-kicker">NHA TRANG · TRIP PLANNER</span>
      <h1>{mode === 'signup' ? '계정 만들기' : reset ? '비밀번호 재설정' : '여행 계획 로그인'}</h1>
      <p>로그인하면 여행 일정과 예산이 계정에 안전하게 저장됩니다.</p>
      {reset && <p className="auth-reset-help">가입할 때 사용한 이메일을 입력해 주세요. 메일이 도착하지 않으면 스팸함과 Firebase 이메일 템플릿 설정을 확인하세요.</p>}
      <label>이메일<input autoComplete="email" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      {!reset && <label>비밀번호<input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type="password" minLength={mode === 'signup' ? 12 : 6} required value={password} onChange={event => setPassword(event.target.value)} /></label>}
      {mode === 'signup' && <p className="auth-reset-help">새 계정 비밀번호는 12자 이상으로 설정해 주세요.</p>}
      {message && <p className={`auth-message ${reset && message.startsWith('요청을 처리했습니다') ? 'is-success' : ''}`} role={reset && message.startsWith('요청을 처리했습니다') ? 'status' : 'alert'}>{message}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? '처리 중…' : reset ? '재설정 이메일 보내기' : mode === 'signup' ? '계정 만들기' : '로그인'}</button>
      <div className="auth-links">
        {mode === 'signin' && <button type="button" onClick={() => { setMessage(''); setMode('reset'); }}>비밀번호를 잊으셨나요?</button>}
        <button type="button" onClick={() => { setMessage(''); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>{mode === 'signup' ? '이미 계정이 있어요 · 로그인' : '처음 사용하시나요? 계정 만들기'}</button>
        {reset && <button type="button" onClick={() => { setMessage(''); setMode('signin'); }}>로그인으로 돌아가기</button>}
      </div>
    </form>
  </main>;
}
