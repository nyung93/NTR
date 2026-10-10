import React, { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { X } from 'lucide-react';
import './my-page.css';

export default function MyPage({ user, onClose }) {
  const [name, setName] = useState(user.displayName || '');
  const [newEmail, setNewEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const begin = action => { setBusy(action); setMessage(''); setError(''); };
  const fail = cause => {
    const messages = {
      'auth/requires-recent-login': '보안을 위해 로그아웃 후 다시 로그인한 다음 시도해 주세요.',
      'auth/wrong-password': '현재 비밀번호가 올바르지 않습니다.',
      'auth/invalid-credential': '현재 비밀번호를 확인해 주세요.',
      'auth/email-already-in-use': '이미 사용 중인 이메일 주소입니다.',
      'auth/invalid-email': '이메일 주소 형식을 확인해 주세요.',
      'auth/weak-password': '비밀번호는 12자 이상으로 설정해 주세요.',
      'auth/too-many-requests': '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
      'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
    };
    setError(messages[cause.code] || `저장하지 못했습니다. Firebase 오류 코드: ${cause.code || 'unknown'}.`);
  };

  async function saveName(event) {
    event.preventDefault();
    begin('name');
    try {
      await updateProfile(user, { displayName: name.trim() });
      setMessage('이름을 저장했습니다.');
    } catch (cause) { fail(cause); }
    finally { setBusy(''); }
  }

  async function requestEmailChange(event) {
    event.preventDefault();
    if (newEmail.trim().toLowerCase() === user.email?.toLowerCase()) {
      setError('현재와 다른 이메일 주소를 입력해 주세요.');
      return;
    }
    begin('email');
    try {
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      setMessage('새 이메일 주소로 확인 링크를 보냈습니다. 링크를 확인한 뒤 다시 로그인하면 변경된 주소가 적용됩니다.');
    } catch (cause) { fail(cause); }
    finally { setBusy(''); }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (password.length < 12) {
      setError('새 비밀번호는 12자 이상으로 설정해 주세요.');
      return;
    }
    begin('password');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, password);
      setCurrentPassword('');
      setPassword('');
      setMessage('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    } catch (cause) { fail(cause); }
    finally { setBusy(''); }
  }

  return <div className="my-page-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="my-page-dialog" role="dialog" aria-modal="true" aria-labelledby="my-page-title">
      <header><div><span className="eyebrow">MY ACCOUNT</span><h2 id="my-page-title">마이페이지</h2></div><button type="button" aria-label="마이페이지 닫기" disabled={Boolean(busy)} onClick={onClose}><X/></button></header>
      <form onSubmit={saveName}>
        <h3>이름</h3>
        <label>표시 이름<input autoComplete="name" maxLength={40} value={name} onChange={event => setName(event.target.value)} placeholder="이름을 입력하세요"/></label>
        <button className="my-page-action" disabled={Boolean(busy) || !name.trim()}>{busy === 'name' ? '저장 중…' : '이름 저장'}</button>
      </form>
      <form onSubmit={requestEmailChange}>
        <h3>이메일 변경</h3>
        <p className="my-page-help">현재 이메일: <strong>{user.email}</strong></p>
        <p className="my-page-help">이메일 변경 후에는 기존 이메일로 공유받은 여행의 공유 설정도 확인해 주세요.</p>
        <p className="my-page-help">새 주소로 확인 링크를 보낸 뒤, 링크를 눌러야 계정 이메일이 변경됩니다.</p>
        <label>새 이메일<input autoComplete="email" type="email" required value={newEmail} onChange={event => setNewEmail(event.target.value)} placeholder="새 이메일 주소"/></label>
        <button className="my-page-action" disabled={Boolean(busy) || !newEmail.trim()}>{busy === 'email' ? '확인 메일 보내는 중…' : '확인 메일 보내기'}</button>
      </form>
      <form onSubmit={changePassword}>
        <h3>비밀번호 변경</h3>
        <label>현재 비밀번호<input autoComplete="current-password" type="password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
        <label>새 비밀번호<input autoComplete="new-password" type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <p className="my-page-help">보안을 위해 12자 이상을 권장합니다.</p>
        <button className="my-page-action" disabled={Boolean(busy) || !currentPassword || password.length < 12}>{busy === 'password' ? '변경 중…' : '비밀번호 변경'}</button>
      </form>
      {(message || error) && <p className={`my-page-feedback ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || message}</p>}
      <footer><button type="button" className="trip-secondary" disabled={Boolean(busy)} onClick={onClose}>닫기</button></footer>
    </section>
  </div>;
}
