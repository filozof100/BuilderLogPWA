import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import LoginCredentials from '../../LoginCredentials.js';
import getSharedPreferences from '../../utils/SharedPreferences.js';
import Modal from '../../ui/components/Modal.jsx';
import { SettingsIcon } from '../../ui/components/SettingsAccessBar.jsx';
import './SettingsActivity.css';

const settingsValue = value => value == null || value.trim().toLowerCase() === 'null' ? '' : value;
const fields = [
  ['first_name', 'Ime *', 'Ime', 'given-name'],
  ['last_name', 'Prezime *', 'Prezime', 'family-name'],
  ['username', 'Korisničko ime *', 'Korisničko ime', 'username'],
  ['password', 'Lozinka', '', 'new-password'],
  ['phone', 'Telefon (opciono)', 'Telefon', 'tel'],
  ['email', 'Email (opciono)', 'Email', 'email'],
];

export default function SettingsActivity({ onBack, onLogout }) {
  const worker = Session.getCurrentUser();
  const [values, setValues] = useState(() => ({
    first_name: settingsValue(worker.getFirstName()), last_name: settingsValue(worker.getLastName()),
    username: settingsValue(worker.getUsername()), password: '',
    phone: settingsValue(worker.getPhoneNumber()), email: settingsValue(worker.getEmail()),
  }));
  const preferences = useRef(getSharedPreferences('com.s2d2.radulovic.LOGIN_PREFERENCES')).current;
  const initialPassword = useRef('');
  const [credentialsReady, setCredentialsReady] = useState(false);
  useEffect(() => {
    let active = true;
    async function restorePassword() {
      const password = preferences.getString('username', null) === worker.getUsername()
        ? await LoginCredentials.password(preferences) : '';
      if (active) { initialPassword.current = password; setValues(previous => ({ ...previous, password })); setCredentialsReady(true); }
    }
    restorePassword();
    return () => { active = false; };
  }, []);
  function logout() {
    LoginCredentials.clear(preferences);
    preferences.edit().remove('user_role').apply();
    onLogout();
  }
  const [visible, setVisible] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  useBackLayer(true, () => onBack(), saving);
  const savingRef = useRef(false);
  const form = useRef(null);
  function validation(key) {
    const value = values[key].trim();
    if (['first_name', 'last_name', 'username'].includes(key) && (!value || value === '-')) return 'Obavezno polje.';
    if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Unesite ispravnu email adresu.';
    return '';
  }
  function save(event) {
    event.preventDefault();
    if (savingRef.current || !credentialsReady) return;
    setSubmitted(true);
    const invalid = fields.find(([key]) => validation(key));
    if (invalid) { form.current.elements.namedItem(invalid[0]).focus(); return; }
    const body = { first_name: values.first_name.trim(), last_name: values.last_name.trim(),
      username: values.username.trim(), phone: values.phone.trim(), email: values.email.trim() };
    if (values.password.trim() && values.password !== initialPassword.current) body.password = values.password;
    const previousUsername = worker.getUsername();
    savingRef.current = true; setSaving(true); setError('');
    document.activeElement?.blur();
    const fail = () => { savingRef.current = false; setSaving(false); showToast('Ažuriranje podataka nije uspelo'); };
    try {
      WebUtils.sendPATCHRequest('workers/' + worker.getId(), JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
        async onSuccess() {
          worker.setFirstName(body.first_name); worker.setLastName(body.last_name); worker.setUsername(body.username);
          worker.setPhoneNumber(body.phone); worker.setEmail(body.email);
          if (preferences.getString('username', null) === previousUsername) {
            await LoginCredentials.save(preferences, worker.getUsername(), body.password ?? initialPassword.current, preferences.getBoolean('remember_me', false));
          }
          savingRef.current = false; setSaving(false);
          onBack('Podaci uspešno ažurirani');
        }, onFailure: fail,
      });
    } catch { fail(); }
  }
  return <main className="settings-screen">
    <header className="settings-title">
      <button type="button" className="settings-action-icon" aria-label="Nazad" disabled={saving || !credentialsReady} onClick={() => onBack()}><BackIcon /></button>
      <span className="settings-avatar"><SettingsIcon /></span><h1>PODEŠAVANJA</h1>
      <button type="button" className="settings-action-icon logout-button" aria-label="Odjavi se" disabled={saving || !credentialsReady} onClick={() => setShowLogout(true)}><LogoutIcon /></button>
    </header>
    <form ref={form} onSubmit={save} noValidate className="settings-form">
      <div className="settings-fields">
        {fields.map(([key, label, placeholder, autocomplete]) => {
          const message = (touched[key] || submitted) ? validation(key) : '';
          return <div className="settings-field" key={key}>
            <label htmlFor={'settings-' + key}>{label}</label>
            <div className={'settings-input' + (message ? ' invalid' : '')}>
              <input id={'settings-' + key} name={key} value={values[key]} placeholder={placeholder} disabled={saving || !credentialsReady}
                type={key === 'password' ? (visible ? 'text' : 'password') : key === 'phone' ? 'tel' : 'text'}
                inputMode={key === 'email' ? 'email' : undefined} autoComplete={autocomplete}
                autoCapitalize={key === 'first_name' || key === 'last_name' ? 'words' : 'none'}
                spellCheck={false} aria-required={label.endsWith('*')} aria-invalid={!!message}
                aria-describedby={message ? 'settings-error-' + key : undefined}
                onBlur={() => setTouched(previous => ({ ...previous, [key]: true }))}
                onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} />
              {key === 'password' && <button type="button" className="password-toggle" aria-label={visible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                aria-pressed={visible} disabled={saving || !credentialsReady} onClick={() => setVisible(!visible)}><EyeIcon visible={visible} /></button>}
            </div>
            {message && <p id={'settings-error-' + key} className="settings-field-error">{message}</p>}
          </div>;
        })}
        {error && <p role="alert" className="error-message">{error}</p>}
      </div>
      <footer className="settings-actions">
        <button type="button" disabled={saving || !credentialsReady} onClick={() => onBack()}>Otkaži</button>
        <button type="submit" className="settings-save" disabled={saving || !credentialsReady}><img src="/assets/drawable/ic_save.svg" alt="" />Sačuvaj</button>
      </footer>
    </form>
    {showLogout && <Modal className="settings-logout-dialog" title={<><LogoutIcon />Odjava</>} onClose={() => setShowLogout(false)}
      actions={<><button type="button" className="text-button" onClick={() => setShowLogout(false)}>Otkaži</button>
        <button type="button" className="text-button logout-button" onClick={logout}><LogoutIcon />Odjavi se</button></>}>
      <p>Da li želite da se odjavite?</p>
    </Modal>}
  </main>;
}
function BackIcon() {
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20z" /></svg>;
}
function LogoutIcon() {
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H9v2h9.17l-2.58 2.59L17 17l5-5zM5 5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5z" /></svg>;
}
function EyeIcon({ visible }) {
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7.2a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Z" />
    {visible && <path d="m3 3 18 18" stroke="currentColor" strokeWidth="2.5" />}
  </svg>;
}
