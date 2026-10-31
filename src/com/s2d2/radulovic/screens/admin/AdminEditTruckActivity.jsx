import React, { useRef, useState } from 'react';
import { Title, Icon, mutate } from './AdminShared.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminAddTruckActivity.css';

export default function AdminEditTruckActivity({ machine, onBack, onSaved }) {
  const name = machine.getName() || '';
  const [licensePlate, setLicensePlate] = useState(machine.getLicensePlate() || '');
  const [active, setActive] = useState((machine.getStatus() || 'active').toLowerCase() === 'active');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false), plate = useRef(null);
  useBackLayer(true, onBack, busy);
  const invalid = !licensePlate.trim() || licensePlate === '-';
  function save(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true);
    if (invalid) { plate.current.focus(); return; }
    if (!name.trim()) return;
    lock.current = true; setBusy(true);
    mutate('PATCH', 'machines/' + machine.getMachineId(), {
      owner_type: 'company', owner_id: '1', name: name.trim(), license_plate: licensePlate.trim(), type: 'truck', status: active ? 'active' : 'inactive',
    }, {
      onSuccess() { lock.current = false; setBusy(false); showToast('Podaci o kamionu uspešno ažurirani'); onSaved(); },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno ažuriranje podataka'); },
    });
  }
  return <form className="admin-screen admin-add-truck admin-edit-truck" onSubmit={save} noValidate autoComplete="off">
    <Title title="IZMENI KAMION" subtitle="Izmena podataka o kamionu." icon="ic_truck_black"/>
    <div className="add-truck-scroll"><fieldset className="add-truck-fields" disabled={busy}>
      <div className="add-truck-field"><span>Naziv</span><div className="add-truck-type">{name}</div></div>
      <label className="add-truck-field"><span>Registarska tablica *</span>
        <input ref={plate} name="license_plate" aria-label="Registarska tablica *" aria-required="true" aria-invalid={(touched || submitted) && invalid}
          placeholder="Unesite registarsku tablicu" autoCapitalize="words" value={licensePlate} onChange={event => setLicensePlate(event.target.value)} onBlur={() => setTouched(true)}/>
        {(touched || submitted) && invalid && <small className="add-truck-error">Obavezno polje.</small>}
      </label>
      <div className="add-truck-field"><span>Tip</span><div className="add-truck-type">Kamion</div></div>
      <div className="add-truck-field"><span>Status</span><div className="add-truck-status" role="group" aria-label="Status">
        {[true, false].map(value => <button key={String(value)} type="button" aria-pressed={active === value} onClick={() => setActive(value)}>{value ? 'Aktivan' : 'Neaktivan'}</button>)}
      </div></div>
    </fieldset></div>
    <div>{submitted && !invalid && !name.trim() && <small className="add-truck-error">Proverite obavezna polja i izbor gradilišta.</small>}
      <button type="submit" className="add-truck-save" style={{ width: '100%' }} disabled={busy}><Icon name="ic_save"/>Sačuvaj kamion</button>
    </div>
  </form>;
}
