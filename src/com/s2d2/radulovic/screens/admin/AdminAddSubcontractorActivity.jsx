import React, { useRef, useState } from 'react';
import { Title, Icon, mutate } from './AdminShared.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminAddSubcontractorActivity.css';

export default function AdminAddSubcontractorActivity({ onBack, onSaved }) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false), form = useRef(null), nameInput = useRef(null);
  useBackLayer(true, onBack, busy);
  const invalid = !name.trim() || name === '-';
  function save(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true);
    if (invalid) { nameInput.current.focus(); return; }
    lock.current = true; setBusy(true);
    mutate('POST', 'subcontractors', { name: name.trim(), phone: phone.trim(), is_active: active }, {
      onSuccess() {
        lock.current = false; setBusy(false);
        setName(''); setPhone(''); setActive(true); setSubmitted(false); setTouched(false);
        form.current?.querySelector(':focus')?.blur();
        showToast('Podizvođač uspešno dodat'); onSaved();
      },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno dodavanje podizvođača'); },
    });
  }
  return <form ref={form} className="admin-screen admin-add-subcontractor" onSubmit={save} noValidate autoComplete="off">
    <Title title="NOVI PODIZVOĐAČ" subtitle="Dodavanje novog podizvođača u sistem." icon="ic_workers_black_no_bg_original_proportions"/>
    <div className="add-subcontractor-scroll"><fieldset disabled={busy} className="add-subcontractor-fields">
      <label className="add-subcontractor-field"><span>Naziv *</span>
        <input ref={nameInput} name="name" aria-label="Naziv *" aria-required="true" aria-invalid={(submitted || touched) && invalid} placeholder="Unesite naziv" value={name} autoCapitalize="words" onChange={event => setName(event.target.value)} onBlur={() => setTouched(true)}/>
        {(submitted || touched) && invalid && <small className="add-subcontractor-error">Obavezno polje.</small>}
      </label>
      <div className="add-subcontractor-field"><span>Status</span><div className="add-subcontractor-status" role="group" aria-label="Status">
        {[true, false].map(value => <button key={String(value)} type="button" aria-pressed={active === value} onClick={() => setActive(value)}>{value ? 'Aktivan' : 'Neaktivan'}</button>)}
      </div></div>
      <div className="add-subcontractor-field"><span>Uloga</span><div className="add-subcontractor-type">Podizvođač</div></div>
      <label className="add-subcontractor-field"><span>Telefon (opciono)</span>
        <input name="phone" aria-label="Telefon (opciono)" type="tel" autoCapitalize="off" placeholder="Unesite telefon" value={phone} onChange={event => setPhone(event.target.value)}/>
      </label>
    </fieldset></div>
    <button type="submit" className="add-subcontractor-save" disabled={busy}><Icon name="ic_save"/>Sačuvaj podizvođača</button>
  </form>;
}
