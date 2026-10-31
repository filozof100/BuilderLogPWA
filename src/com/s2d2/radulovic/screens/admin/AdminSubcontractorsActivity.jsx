import LoadFailureToast from '../../LoadFailureToast.jsx';
import AdminSubcontractorDetailsActivity from './AdminSubcontractorDetailsActivity.jsx';
import AdminAddSubcontractorActivity from './AdminAddSubcontractorActivity.jsx';
import React, { useRef, useState } from 'react';
import Session from '../../network/Session.js';
import { Title, Icon, Search, Notice, useLoad, mutate } from './AdminShared.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import './AdminSubcontractorsActivity.css';

export default function AdminSubcontractorsActivity() {
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [removed, setRemoved] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const subcontractors = useLoad(cb => Session.getAllSubcontractorsFromServer(cb), [], []);
  const query = search.trim().toLocaleLowerCase();
  const rows = subcontractors.data.filter(item => !removed.includes(item.getSubcontractorId()) && item.getName().toLocaleLowerCase().includes(query))
    .sort((a, b) => a.getName().toLocaleLowerCase().localeCompare(b.getName().toLocaleLowerCase()));
  function remove() {
    if (lock.current) return;
    const id = removing.getSubcontractorId();
    lock.current = true; setBusy(true);
    mutate('DELETE', 'subcontractors/' + id, { reason: 'Admin obrisao' }, {
      onSuccess() { lock.current = false; setBusy(false); setRemoved(ids => [...ids, id]); setRemoving(null); },
      onFailure() { lock.current = false; setBusy(false); showToast('Neuspešno brisanje podizvođača.'); },
    });
  }
  if (selected) return <AdminSubcontractorDetailsActivity subcontractor={selected} onBack={() => setSelected(null)} onUpdated={subcontractors.reload}/>;
  if (adding) return <AdminAddSubcontractorActivity onBack={() => setAdding(false)} onSaved={subcontractors.reload}/>;
  return <section className="admin-screen admin-subcontractors">
    <Title title="PODIZVOĐAČI" subtitle="Pregled i upravljanje podizvođačima." icon="ic_workers_black_no_bg_original_proportions"/>
    <Search value={search} onChange={setSearch} placeholder="Pretraži podizvođače..."/>
    <button type="button" className="admin-subcontractor-add" onClick={() => setAdding(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>Dodaj podizvođača</button>
    {subcontractors.loading ? <Notice>Učitavanje podizvođača...</Notice> : subcontractors.error ? <LoadFailureToast message="Učitavanje podizvođača nije uspelo."/> : !rows.length ? <Notice>Nema dostupnih podizvođača.</Notice> :
      <div className="admin-subcontractor-list">{rows.map(item => <article className="admin-subcontractor-row" key={item.getSubcontractorId()}>
        <button type="button" className="admin-subcontractor-open" aria-label={'Aktivnost podizvođača: ' + item.getName()} onClick={() => setSelected(item)}><span className="admin-subcontractor-icon"><Icon name="ic_workers_black_no_bg_original_proportions"/></span><strong>{item.getName()}</strong></button>
        <button type="button" aria-label={'Obriši podizvođača: ' + item.getName()} onClick={() => setRemoving(item)}><i aria-hidden="true"/></button>
      </article>)}</div>}
    {removing && <Modal className="admin-subcontractor-delete" title="Obriši podizvođača?" busy={busy} onClose={() => setRemoving(null)} actions={<>
      <button type="button" disabled={busy} onClick={() => setRemoving(null)}>Otkaži</button>
      <button type="button" className="subcontractor-delete-confirm" disabled={busy} onClick={remove}>{busy ? 'Brisanje...' : 'Obriši'}</button>
    </>}><p>Da li ste sigurni da želite da obrišete podizvođača {removing.getName()}?</p></Modal>}
  </section>;
}
