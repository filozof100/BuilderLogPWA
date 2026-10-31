import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import LoginCredentials from '../../LoginCredentials.js';
import getSharedPreferences from '../../utils/SharedPreferences.js';
import './LoginActivity.css';

export default function LoginActivity({ onAuthenticated, initialError = '', initialValues, allowAutomaticLogin = true }) {
  const [username, setUsername] = useState(initialValues?.username ?? '');
  const [password, setPassword] = useState(initialValues?.password ?? 'password');
  const [rememberMe, setRememberMe] = useState(initialValues?.rememberMe ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const submitting = useRef(false);
  const preferences = useRef(getSharedPreferences('com.s2d2.radulovic.LOGIN_PREFERENCES')).current;
  const [ready, setReady] = useState(!!initialValues);
  function submit(username, password, rememberMe) {
    if (submitting.current) return;
    submitting.current = true; setLoading(true); setError('');
    sendLoginRequest(preferences, rememberMe, username.trim(), password, onAuthenticated, () => {
      submitting.current = false; setLoading(false);
    });
  }
  useEffect(() => {
    if (initialValues) return;
    let active = true;
    async function restore() {
      const savedRememberMe = preferences.getBoolean('remember_me', false);
      const savedUsername = savedRememberMe ? preferences.getString('username', '') : '';
      const savedPassword = savedRememberMe ? await LoginCredentials.password(preferences) : 'password';
      if (!active) return;
      const remember = preferences.getBoolean('remember_me', false);
      setUsername(savedUsername); setPassword(savedPassword); setRememberMe(remember); setReady(true);
      if (allowAutomaticLogin && !initialError && remember && savedUsername.trim() && savedPassword.trim()) submit(savedUsername, savedPassword, remember);
    }
    restore();
    return () => { active = false; };
  }, []);
  function login(event) {
    event.preventDefault();
    if (!ready || submitting.current) return;
    if (!username.trim() || !password.trim()) { showToast('Unesite korisničko ime i lozinku'); return; }
    submit(username, password, rememberMe);
  }

  return (
    <main className="login-screen" aria-labelledby="login-title">
      <LoginHero />
      <form autoComplete="off" className="login-fields" aria-label="Prijava" onSubmit={login} aria-busy={loading}>
        <LoginInputField
          id="login-username"
          label="Korisničko ime"
          placeholder="Unesite korisničko ime"
          icon="ic_login_user"
          value={username}
          onChange={setUsername}
          disabled={loading || !ready}
        />
        <LoginInputField
          id="login-password"
          label="Lozinka"
          placeholder="Unesite lozinku"
          icon="ic_login_lock"
          value={password}
          onChange={setPassword}
          disabled={loading || !ready}
          password
        />
        <RememberMeRow checked={rememberMe} onChange={setRememberMe} disabled={loading || !ready} />
        <Toast message={error} onDismiss={() => setError('')}/>
        <button className="login-submit" type="submit" disabled={loading || !ready}>
          Prijavi se
        </button>
      </form>
    </main>
  );
}

function sendLoginRequest(preferences, rememberMe, username, password, onAuthenticated, onFinished) {
  WebUtils.sendPOSTRequest('login', JSON.stringify({ username, password }), {
    async onSuccess(responseBody) {
      try {
        Session.createUser(responseBody);
        try {
          preferences.edit().putString('user_role', Session.getCurrentUser().getRole()).apply();
        }
        catch { /* Credential saving below reports unavailable browser storage. */ }
        if (!await LoginCredentials.save(preferences, username, password, rememberMe)) showToast('Čuvanje lozinke nije uspelo (' + LoginCredentials.lastError + ').');
        onFinished();
        onAuthenticated({ username, password, rememberMe });
      } catch (exception) {
        Session.clearSession(); onFinished();
        showToast('Neispravan odgovor servera ' + exception.message);
      }
    },
    onFailure() { onFinished(); showToast('Login nije uspeo'); },
  });
}

function LoginHero() {
  return (
    <header className="login-hero">
      {/* Exact normalized Canvas paths from LoginHero, stretched to its 320dp height. */}
      <svg
        className="login-hero-waves"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="login-wave-yellow" d="M0 78 C30 70 58 95 100 82 L100 100 L0 100 Z" />
        <path className="login-wave-white" d="M0 80.5 C30 73 58 97 100 85 L100 100 L0 100 Z" />
      </svg>
      <div className="login-brand">
        <img
          className="login-logo"
          src="/assets/drawable/radulovic_logo.svg"
          alt=""
          width="88"
          height="88"
        />
        <h1 id="login-title">Radulović gradnja</h1>
      </div>
    </header>
  );
}

function LoginInputField({ id, label, placeholder, icon, password = false, value, onChange, disabled }) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="login-field">
      <label htmlFor={id}>{label}</label>
      <div className="login-input-row">
        <img
          className="login-field-icon"
          src={`/assets/drawable/${icon}.svg`}
          alt=""
          width="22"
          height="22"
        />
        <input
          id={id}
          type={password && !passwordVisible ? 'password' : 'text'}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
          name={password ? 'password' : 'username'}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        {password && (
          <button
            className="login-password-visibility"
            type="button"
            aria-label={passwordVisible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            aria-controls={id}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible(visible => !visible)}
          >
            <img
              src={passwordVisible ? '/assets/material/visibility_off.svg' : '/assets/material/visibility.svg'}
              alt=""
              width="24"
              height="24"
            />
          </button>
        )}
      </div>
    </div>
  );
}

function RememberMeRow({ checked, onChange, disabled }) {
  return (
    <label className="login-remember">
      <span className="login-checkbox-control">
        <input
          className="login-checkbox"
          type="checkbox"
          name="rememberMe"
          checked={checked}
          onChange={event => onChange(event.target.checked)}
          disabled={disabled}
        />
        <svg
          className="login-checkbox-check"
          viewBox="0 0 14 14"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M1.4 7.7 L5.32 11.48 L12.6 2.52"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>Zapamti me</span>
    </label>
  );
}
