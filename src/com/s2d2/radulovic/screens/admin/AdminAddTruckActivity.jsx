import React, { useRef, useState } from 'react';
import { Title, Icon, mutate } from './AdminShared.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminAddTruckActivity.css';

export default function AdminAddTruckActivity({ onBack, onSaved }) {
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');
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
      owner_type: 'company', owner_id: '1', initial_mileage: mileage || '0',
      name: name.trim(), license_plate: licensePlate.trim(), type: 'truck', status: active ? 'active' : 'inactive',
    }, {
      onSuccess() {
        lock.current = false; setBusy(false);
        setName(''); setLicensePlate(''); setMileage(''); setActive(true); setSubmitted(false); setTouched({});
        form.current?.querySelector(':focus')?.blur();
        showToast('Kamion uspešno dodat'); onSaved();
      },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno dodavanje kamiona'); },
    });
  }
  function field(key, label, value, change, placeholder, required = false) {
    const error = required && (submitted || touched[key]) && invalid(value);
    return <label className="add-truck-field"><span>{label}</span>
      <input name={key} aria-label={label} aria-required={required} aria-invalid={!!error} value={value} placeholder={placeholder}
        inputMode={key === 'initial_mileage' ? 'numeric' : 'text'} autoCapitalize={key === 'initial_mileage' ? 'off' : 'words'}
        onChange={event => change(event.target.value)} onBlur={() => setTouched(previous => ({ ...previous, [key]: true }))}/>
      {error && <small className="add-truck-error">Obavezno polje.</small>}
    </label>;
  }
  return <form ref={form} className="admin-screen admin-add-truck" onSubmit={save} noValidate autoComplete="off">
    <Title title="NOVI KAMION" subtitle="Dodavanje novog kamiona u sistem." icon="ic_truck_black"/>
    <div className="add-truck-scroll"><fieldset disabled={busy} className="add-truck-fields">
      {field('name', 'Naziv *', name, setName, 'Unesite naziv kamiona', true)}
      {field('license_plate', 'Registarska tablica *', licensePlate, setLicensePlate, 'Unesite registarsku tablicu', true)}
      {field('initial_mileage', 'Trenutna kilometraža (opciono)', mileage, value => setMileage(value.replace(/\D/g, '')), 'Unesite trenutnu kilometražu')}
      <div className="add-truck-field"><span>Tip</span><div className="add-truck-type">Kamion</div></div>
      <div className="add-truck-field"><span>Status</span><div className="add-truck-status" role="group" aria-label="Status">
        {[true, false].map(value => <button key={String(value)} type="button" aria-pressed={active === value} onClick={() => setActive(value)}>{value ? 'Aktivan' : 'Neaktivan'}</button>)}
      </div></div>
    </fieldset></div>
    <button type="submit" className="add-truck-save" disabled={busy}><Icon name="ic_save"/>Sačuvaj kamion</button>
  </form>;
}
