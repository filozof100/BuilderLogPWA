import { showToast } from '../../ui/components/Toast.jsx';
import React, { useRef, useState } from 'react';
import Session from '../../network/Session.js';
import AdminTaskControls, { workerRoles } from './AdminTaskControls.jsx';
import { Title, Notice, useLoad, mutate } from './AdminShared.jsx';
import './AdminTasksActivity.css';
import './TaskCreationActivity.css';

const capitalize = value => value.replace(/\p{L}/u, letter => letter.toLocaleUpperCase('sr-Latn'));
export default function TaskCreationActivity({ initialTab, initialSite, initialWorker, onBusy, onSaved }) {
  const [tab, setTab] = useState(initialTab);
  const [site, setSite] = useState(initialSite);
  const [selectedWorkers, setSelectedWorkers] = useState(initialWorker ? { [initialTab]: initialWorker } : {});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const form = useRef(null);
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const workers = useLoad(cb => Session.getAllWorkersFromServerAdmin(cb), [], []);
  const worker = selectedWorkers[tab];
  const missingSite = tab === 2 && !site;
  const missingWorker = !!workerRoles[tab] && !worker;
  const invalid = value => !value.trim() || value === '-';
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true); setError('');
    const firstInvalid = missingSite ? '[data-task-field="site"] .selection-field'
      : missingWorker ? '[data-task-field="worker"] .selection-field'
      : invalid(name) ? '[name="title"]' : invalid(description) ? '[name="description"]' : null;
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const control = form.current?.querySelector(firstInvalid);
        control?.focus({ preventScroll: true });
        control?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    const body = { title: name.trim(), description: description.trim() };
    if (tab === 0) body.target_role = 'site_manager';
    else if (tab === 2) body.construction_site_id = site.getId();
    else body.worker_id = worker.getId();
    setSubmitted(false); setTouched({});
    setBusy(true); onBusy(true);
    mutate('POST', 'tasks', body, {
      onSuccess() { setBusy(false); onBusy(false); onSaved(); },
      onFailure() { setBusy(false); onBusy(false); showToast('Kreiranje zadatka nije uspelo'); },
    });
  }
  return <form ref={form} className="admin-screen admin-tasks admin-task-creation" onSubmit={submit} noValidate>
    <Title title="KREIRANJE ZADATKA" subtitle="Unesite podatke za novi zadatak." icon="ic_tasks_black"/>
    <fieldset disabled={busy}>
      <AdminTaskControls required tab={tab} setTab={setTab} site={site} setSite={setSite} selectedWorkers={selectedWorkers} setSelectedWorkers={setSelectedWorkers} sites={sites} workers={workers}
        validation={{site: missingSite && (submitted || touched.site), worker: missingWorker && (submitted || touched['worker-' + tab])}}
        onFieldBlur={key => setTouched(values => ({...values, [key === 'worker' ? 'worker-' + tab : key]: true}))}/>
      
      
      <label className="admin-task-input"><span>Naziv *</span>
        <input name="title" aria-required="true" aria-invalid={(submitted || touched.name) && invalid(name)} autoComplete="off" autoCapitalize="sentences" placeholder="Unesite naziv" value={name} onChange={event => setName(capitalize(event.target.value))} onBlur={() => setTouched(values => ({ ...values, name: true }))}/>
        {(submitted || touched.name) && invalid(name) && <small className="error-message">Obavezno polje.</small>}
      </label>
      <label className="admin-task-input"><span>Opis *</span>
        <textarea name="description" aria-required="true" aria-invalid={(submitted || touched.description) && invalid(description)} autoCapitalize="sentences" placeholder="Unesite opis" value={description} onChange={event => setDescription(capitalize(event.target.value))} onBlur={() => setTouched(values => ({ ...values, description: true }))}/>
        {(submitted || touched.description) && invalid(description) && <small className="error-message">Obavezno polje.</small>}
      </label>
      <button type="submit" className="admin-task-add"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>Kreiraj zadatak</button>
    </fieldset>
    {error && <p className="error-message" role="alert">{error}</p>}
  </form>;
}
