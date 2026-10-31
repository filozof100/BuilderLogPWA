import React, { useRef, useState } from 'react';
import { Title, Icon, mutate } from './AdminShared.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminAddExcavatorActivity.css';

export default function AdminAddExcavatorActivity({ onBack, onSaved }) {
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [active, setActive] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const lock = useRef(false), form = useRef(null);
  useBackLayer(true, onBack, busy);
  const invalid = value => !value.trim() || value === '-';
  function save(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true);
    if (invalid(name) || invalid(licensePlate)) {
      form.current.elements[invalid(name) ? 'name' : 'license_plate'].focus();
      return;
    }
    lock.current = true; setBusy(true);
    mutate('POST', 'machines', {
      owner_type: 'company', owner_id: '1', initial_work_hours: workHours || '0',
      name: name.trim(), license_plate: licensePlate.trim(), type: 'excavator', status: active ? 'active' : 'inactive',
    }, {
      onSuccess() {
        lock.current = false; setBusy(false);
        setName(''); setLicensePlate(''); setWorkHours(''); setActive(true); setSubmitted(false); setTouched({});
        form.current?.querySelector(':focus')?.blur();
        showToast('Bager uspešno dodat'); onSaved();
      },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno dodavanje bagera'); },
    });
  }
  function field(key, label, value, change, placeholder, required = false) {
    const error = required && (submitted || touched[key]) && invalid(value);
    return <label className="add-excavator-field"><span>{label}</span>
      <input name={key} aria-label={label} aria-required={required} aria-invalid={!!error} value={value} placeholder={placeholder}
        inputMode={key === 'initial_work_hours' ? 'numeric' : 'text'} autoCapitalize={key === 'initial_work_hours' ? 'off' : 'words'}
        onChange={event => change(event.target.value)} onBlur={() => setTouched(previous => ({ ...previous, [key]: true }))}/>
      {error && <small className="add-excavator-error">Obavezno polje.</small>}
    </label>;
  }
  return <form ref={form} className="admin-screen admin-add-excavator" onSubmit={save} noValidate autoComplete="off">
    <Title title="NOVI BAGER" subtitle="Dodavanje novog bagera u sistem." icon="ic_excavator_black"/>
    <div className="add-excavator-scroll"><fieldset disabled={busy} className="add-excavator-fields">
      {field('name', 'Naziv *', name, setName, 'Unesite naziv bagera', true)}
      {field('license_plate', 'Registarska tablica *', licensePlate, setLicensePlate, 'Unesite registarsku tablicu', true)}
      {field('initial_work_hours', 'Trenutni radni sati (opciono)', workHours, value => setWorkHours(value.replace(/\D/g, '')), 'Unesite trenutne radne sate')}
      <div className="add-excavator-field"><span>Tip</span><div className="add-excavator-type">Bager</div></div>
      <div className="add-excavator-field"><span>Status</span><div className="add-excavator-status" role="group" aria-label="Status">
        {[true, false].map(value => <button key={String(value)} type="button" aria-pressed={active === value} onClick={() => setActive(value)}>{value ? 'Aktivan' : 'Neaktivan'}</button>)}
      </div></div>
    </fieldset></div>
    <button type="submit" className="add-excavator-save" disabled={busy}><Icon name="ic_save"/>Sačuvaj bager</button>
  </form>;
}
