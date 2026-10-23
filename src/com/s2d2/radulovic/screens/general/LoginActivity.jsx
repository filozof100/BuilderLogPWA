import React, { useState } from 'react';
import './LoginActivity.css';

// Visual port of Android LoginActivity.kt at cda0929.
// Initial Android state: empty username, masked "password", remember-me unchecked.
// Fields and password visibility are interactive; authentication remains inactive.
export default function LoginActivity() {
  return (
    <main className="login-screen" aria-labelledby="login-title">
      <LoginHero />
      <section className="login-fields" aria-label="Prijava">
        <LoginInputField
          id="login-username"
          label="Korisničko ime"
          placeholder="Unesite korisničko ime"
          icon="ic_login_user"
        />
        <LoginInputField
          id="login-password"
          label="Lozinka"
          placeholder="Unesite lozinku"
          icon="ic_login_lock"
          password
        />
        <RememberMeRow />
        <button className="login-submit" type="button" aria-disabled="true">
          Prijavi se
        </button>
      </section>
    </main>
  );
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

function LoginInputField({ id, label, placeholder, icon, password = false }) {
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
          defaultValue={password ? 'password' : ''}
          placeholder={placeholder}
          autoComplete="off"
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

function RememberMeRow() {
  return (
    <div className="login-remember">
      <span
        className="login-checkbox"
        role="checkbox"
        aria-checked="false"
        aria-disabled="true"
        aria-labelledby="login-remember-label"
      />
      <span id="login-remember-label">Zapamti me</span>
    </div>
  );
}
