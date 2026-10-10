import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const logOut = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await signOut(auth);
    } catch {
      setError('로그아웃하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };
  return <>
    <button type="button" className="auth-signout" disabled={busy} onClick={logOut}>{busy ? '로그아웃 중…' : '로그아웃'}</button>
    {error && <span className="account-action-error" role="alert">{error}</span>}
  </>;
}
