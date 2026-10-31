import React, { useRef, useState } from 'react';
import { Title, Icon, mutate } from './AdminShared.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminAddSubcontractorActivity.css';

export default function AdminEditSubcontractorActivity({ subcontractor, onBack, onSaved }) {
  const name = subcontractor.getName();
  const [active, setActive] = useState(subcontractor.isActive());
  const [phone, setPhone] = useState(subcontractor.getPhoneNumber());
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useBackLayer(true, onBack, busy);
  function save(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true);
    mutate('PATCH', 'subcontractors/' + subcontractor.getSubcontractorId(), { name, phone: phone.trim(), is_active: active }, {
      onSuccess() {
        lock.current = false; setBusy(false);
        showToast('Podaci uspešno ažurirani'); onSaved();
      },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno ažuriranje podataka'); },
    });
  }
  return <form className="admin-screen admin-add-subcontractor admin-edit-subcontractor" onSubmit={save} noValidate autoComplete="off">
    <Title title="IZMENA PODIZVOĐAČA" subtitle="Izmena podataka za podizvođača u sistemu." icon="ic_workers_black_no_bg_original_proportions"/>
    <div className="add-subcontractor-scroll"><fieldset disabled={busy} className="add-subcontractor-fields">
      <div className="add-subcontractor-field"><span>Naziv</span><div className="add-subcontractor-type">{name}</div></div>
      <div className="add-subcontractor-field"><span>Status</span><div className="add-subcontractor-status" role="group" aria-label="Status">
        {[true, false].map(value => <button key={String(value)} type="button" aria-pressed={active === value} onClick={() => setActive(value)}>{value ? 'Aktivan' : 'Neaktivan'}</button>)}
      </div></div>
      <div className="add-subcontractor-field"><span>Uloga</span><div className="add-subcontractor-type">Podizvođač</div></div>
      <label className="add-subcontractor-field"><span>Telefon (opciono)</span>
        <input name="phone" aria-label="Telefon (opciono)" type="tel" autoCapitalize="off" placeholder="Unesite telefon" value={phone} onChange={event => setPhone(event.target.value)}/>
      </label>
    </fieldset></div>
    <button type="submit" className="add-subcontractor-save" disabled={busy}><Icon name="ic_save"/>Sačuvaj izmene</button>
  </form>;
}
