import { useEffect, useState } from 'react';
import Session from './network/Session.js';

// Android redirects a recreated Activity without its user to LoginActivity.
// PWA protects the authenticated screen tree before mounting its screens.
export default function SessionGuard({ onSessionMissing, children }) {
  const [, checkSession] = useState(0);
  const hasUser = Session.getCurrentUser() != null;
  useEffect(() => {
    if (!hasUser) onSessionMissing();
  }, [hasUser, onSessionMissing]);
  useEffect(() => {
    const check = () => { if (document.visibilityState !== 'hidden') checkSession(value => value + 1); };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
    };
  }, []);
  return hasUser ? children : null;
}
