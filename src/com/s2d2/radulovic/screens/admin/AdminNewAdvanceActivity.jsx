import { showToast } from '../../ui/components/Toast.jsx';
import React, { useState } from 'react';
import { Title, Icon, today } from './AdminShared.jsx';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import './AdminNewAdvanceActivity.css';

export default function AdminNewAdvanceActivity({ manager, advance = null, busy, error, onCancel, onSave }) {
  const [amount, setAmount] = useState(() => advance ? String(advance.getAmount()) : '');
  const [touched, setTouched] = useState(false);
  const [date] = useState(today);
  const numericAmount = Number(amount.replace(',', '.'));
  const validation = !amount ? 'Obavezno polje.' : !(numericAmount > 0) ? 'Unesite ispravan iznos.' : '';
  function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (busy || validation) return;
    if (manager.getId() <= 0) { showToast('Morate uneti ispravan iznos.'); return; }
    onSave(numericAmount);
  }
  return <form className="admin-screen admin-new-advance" onSubmit={submit} noValidate>
    <Title title={advance ? "IZMENA AKONTACIJE" : "NOVA AKONTACIJA"} subtitle={advance ? "Izmena iznosa akontacije za šefa gradilišta." : "Unos nove akontacije za šefa gradilišta."} icon="ic_wallet_black"/>
    <fieldset disabled={busy} className="new-advance-fields">
      <div className="new-advance-readonly"><span>Šef gradilišta</span><div>{manager.getFullName()}</div></div>
      <div className="new-advance-readonly"><span>Datum</span><div><Icon name="ic_calendar"/>{advance ? advance.getDate() : dateLabel(date)}</div></div>
      <label className="new-advance-amount"><span>Iznos *</span><div className={touched && validation ? 'invalid' : ''}>
        <input name="amount" aria-label="Iznos *" aria-required="true" aria-invalid={!!(touched && validation)} aria-describedby={touched && validation ? 'advance-amount-error' : undefined} type="text" inputMode="decimal" autoComplete="off" placeholder="Unesite iznos" value={amount}
          onChange={event => { if (/^\d*([.,]\d{0,2})?$/.test(event.target.value)) setAmount(event.target.value); }} onBlur={() => setTouched(true)}/><b>RSD</b>
      </div>{touched && validation && <small id="advance-amount-error" className="error-message" role="alert">{validation}</small>}</label>
    </fieldset>
    <footer className="new-advance-actions"><button type="button" disabled={busy} onClick={onCancel}>Otkaži</button><button type="submit" disabled={busy}><Icon name="ic_save"/>Sačuvaj</button></footer>
    {error && <p className="error-message" role="alert">{error}</p>}
  </form>;
}
