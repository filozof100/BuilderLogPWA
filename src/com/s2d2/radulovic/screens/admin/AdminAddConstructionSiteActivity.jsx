import LoadFailureToast from '../../LoadFailureToast.jsx';
import React, { useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import useBackLayer from '../../ui/components/useBackLayer.js';
import Modal from '../../ui/components/Modal.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import { Title, Icon, useLoad, mutate } from './AdminShared.jsx';
import './AdminEditConstructionSiteActivity.css';

export default function AdminAddConstructionSiteActivity(props) {
  return <AddConstructionSiteScreen {...props}/>;
}

export function AddConstructionSiteScreen({ constructionSite, onBack, onSaved, onDeleted }) {
  const editing = !!constructionSite;
  const [name, setName] = useState(constructionSite?.getName() ?? '');
  const [active, setActive] = useState(constructionSite?.isActive() ?? true);
  const [ids, setIds] = useState(() => (constructionSite?.getAssignedManagers() ?? []).map(manager => manager.getId()));
  const [picker, setPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);
  const [managersTouched, setManagersTouched] = useState(false);
  const lock = useRef(false), nameInput = useRef(null), managerButton = useRef(null);
  useBackLayer(true, onBack, busy);
  const managers = useLoad(cb => Session.getAllManagersFromServer(cb), [], []);
  const sorted = [...managers.data].sort((a, b) => a.getFullName().toLowerCase().localeCompare(b.getFullName().toLowerCase()));
  const selected = sorted.filter(manager => ids.includes(manager.getId()));
  const managersError = (submitted || managersTouched) && !selected.length;
  const invalidName = !name.trim() || name.trim() === '-';
  function save(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true);
    const control = invalidName ? nameInput.current : !selected.length ? managerButton.current : null;
    if (control) {
      requestAnimationFrame(() => {
        control.focus({ preventScroll: true });
        control.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    setSubmitted(false); setTouched(false); setManagersTouched(false);
    document.activeElement?.blur(); lock.current = true; setBusy(true);
    mutate(editing ? 'PATCH' : 'POST', editing ? 'construction-sites/' + constructionSite.getId() : 'construction-sites', { name, status: active ? 'active' : 'paused', site_manager_ids: ids }, {
      onSuccess() {
        lock.current = false; setBusy(false);
        if (editing) { showToast('Podaci uspešno ažurirani'); onSaved(); }
        else {
          setName(''); setIds([]); setActive(true); setSubmitted(false); setTouched(false);
          showToast('Novo gradilište uspešno dodato'); onSaved();
        }
      },
      onFailure() { lock.current = false; setBusy(false); showToast(editing ? 'Ažuriranje podataka nije uspelo' : 'Neuspešno dodavanje novog gradilišta'); },
    });
  }
  function remove() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    const callback = {
      onSuccess() { lock.current = false; setBusy(false); setDeleting(false); showToast('Gradilište uspešno obrisano'); onDeleted(); },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno brisanje gradilišta'); },
    };
    try { WebUtils.sendDELETERequest('construction-sites/' + constructionSite.getId(), JSON.stringify({ reason: 'admin obrisao' }), { Authorization: Session.getSessionToken() }, callback); }
    catch (error) { callback.onFailure(error); }
  }
  return <form className={"admin-screen admin-edit-site" + (editing ? "" : " admin-add-site")} onSubmit={save} noValidate autoComplete="off">
    <Title title={editing ? "IZMENA GRADILIŠTA" : "NOVO GRADILIŠTE"} icon="ic_construction_site_crane"/>
    <div className="edit-site-scroll"><fieldset className="edit-site-fields" disabled={busy}>
      <label className="edit-site-field"><span>Naziv *</span><input ref={nameInput} aria-label="Naziv *" aria-required="true" aria-invalid={(submitted || touched) && invalidName} placeholder="Unesite naziv gradilišta" value={name} onChange={event => setName(event.target.value)} onBlur={() => setTouched(true)} autoCapitalize="words"/>{(submitted || touched) && invalidName && <small className="edit-site-error">Obavezno polje.</small>}</label>
      <div className="edit-site-field"><span>Dodeljeni šefovi gradilišta *</span>
        <button type="button" ref={managerButton} className="edit-site-manager-picker" aria-required="true" aria-invalid={!!managersError} aria-describedby={managersError ? 'site-managers-error' : undefined} onBlur={() => setManagersTouched(true)} disabled={managers.loading} onClick={() => { document.activeElement?.blur(); if (managers.error) managers.reload(); setPicker(true); }}>
          <span className={!selected.length ? 'muted' : ''}>{managers.loading ? 'Učitavanje šefova gradilišta...' : managers.error ? 'Ponovo otvorite izbor šefova' : !selected.length ? 'Izaberite šefove gradilišta' : 'Izabrano: ' + selected.length}</span><Icon name="ic_chevron_right"/>
        </button>
        {!!selected.length && <div className="edit-site-chips">{selected.map(manager => <span key={manager.getId()}>{manager.getFullName()}<button type="button" disabled={managers.loading} aria-label={'Ukloni šefa ' + manager.getFullName()} onClick={() => setIds(current => current.filter(id => id !== manager.getId()))}><i/></button></span>)}</div>}
        {managersError && <small id="site-managers-error" className="edit-site-error">Obavezno polje.</small>}
      </div>
      <div className="edit-site-field"><span>Status</span><div className="edit-site-status">{[true, false].map(value => <button key={String(value)} type="button" aria-pressed={active === value} onClick={() => setActive(value)}>{value ? 'Aktivno' : 'Neaktivno'}</button>)}</div></div>
    </fieldset>{editing && <button type="button" className="edit-site-delete" disabled={busy} onClick={() => { document.activeElement?.blur(); setDeleting(true); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12Zm2-10h8v10H8V9Zm7.5-5-1-1h-5l-1 1H5v2h14V4z"/></svg>Obriši gradilište</button>}</div>
    <footer className="edit-site-footer"><button type="button" disabled={busy} onClick={onBack}>Otkaži</button><button type="submit" disabled={busy}><Icon name="ic_save"/>Sačuvaj</button></footer>
    {picker && <ManagersDialog managers={sorted} ids={ids} loading={managers.loading} failed={managers.error} onClose={() => setPicker(false)} onConfirm={value => { setIds(value); setPicker(false); }}/>}
    {deleting && <Modal className="edit-site-delete-dialog" title="Obriši gradilište?" onClose={() => setDeleting(false)} busy={busy} actions={<><button type="button" disabled={busy} onClick={() => setDeleting(false)}>Otkaži</button><button type="button" disabled={busy} className="confirm-delete" onClick={remove}>{busy ? 'Brisanje...' : 'Obriši'}</button></>}><p>Da li ste sigurni da želite da obrišete gradilište {constructionSite.getName()}?</p></Modal>}
  </form>;
}
function ManagersDialog({ managers, ids, loading, failed, onClose, onConfirm }) {
  const [draft, setDraft] = useState(ids);
  return <Modal className="site-managers-dialog" title="Dodeljeni šefovi gradilišta" onClose={onClose} actions={<><button type="button" onClick={onClose}>Otkaži</button><button type="button" disabled={!draft.length} onClick={() => onConfirm(draft)}>Potvrdi</button></>}>
    <p>Izaberite jednog ili više šefova gradilišta.</p>
    {failed ? <LoadFailureToast message="Učitavanje šefova gradilišta nije uspelo."/> : loading || !managers.length ? <div className="site-managers-message">{loading ? 'Učitavanje šefova gradilišta...' : failed ? 'Učitavanje šefova gradilišta nije uspelo.' : 'Nema dostupnih šefova gradilišta.'}</div> : <div className="site-managers-list">{managers.map(manager => {
      const chosen = draft.includes(manager.getId());
      return <button type="button" key={manager.getId()} role="checkbox" aria-checked={chosen} onClick={() => setDraft(current => chosen ? current.filter(id => id !== manager.getId()) : [...current, manager.getId()])}><i>{chosen && <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m9 16.17-4.17-4.17L3.41 13.41 9 19 21 7l-1.41-1.41z"/></svg>}</i><span>{manager.getFullName()}</span></button>;
    })}</div>}
  </Modal>;
}
