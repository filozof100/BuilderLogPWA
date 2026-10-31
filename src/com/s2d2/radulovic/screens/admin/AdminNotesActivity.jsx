import React, { useState } from 'react';
import AdminNoteDetailsActivity from './AdminNoteDetailsActivity.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import Session from '../../network/Session.js';
import TimeUtils from '../../utils/TimeUtils.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import { Title, Icon, Notice, DateField, useLoad, today, monthStart } from './AdminShared.jsx';
import './AdminDeliveryNotesActivity.css';
import './AdminNotesActivity.css';

const allSites = { isAllSites: true, getId: () => -1, getName: () => 'Sva gradilišta' };
const sortDate = note => note.getDate().split('.').slice(0, 3).reverse().join('-');

export default function AdminNotesActivity({ onBack, initialSite, initialFrom, initialTo, lockSite = false } = {}) {
  const [selected, setSelected] = useState(null);
  useBackLayer(!!selected, () => setSelected(null));
  const [site, setSite] = useState(() => initialSite ?? Session.getDefaultConstructionSite());
  const [from, setFrom] = useState(() => initialFrom ?? monthStart());
  const [to, setTo] = useState(() => initialTo ?? today());
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const notes = useLoad(cb => {
    if (!site) { cb.onSuccess([]); return; }
    Session.getAllNotesForAdminFromServer(from, to, site === allSites ? null : site, cb);
  }, [site, from, to], []);
  const sorted = [...notes.data].sort((a, b) => sortDate(b).localeCompare(sortDate(a)));
  function quickDate(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const value = TimeUtils.formatDate(date);
    setFrom(value); setTo(value);
  }
  if (selected) return <AdminNoteDetailsActivity note={selected} siteName={(site === allSites ? selected.getConstructionSiteName() : site?.getName()) || '-'}/>;
  return <section className="admin-screen admin-notes">
    <Title title="GRAĐEVINSKI DNEVNIK" subtitle="Dnevni pregled izvedenih radova na gradilištu." icon="ic_diary"/>
    <div className="admin-notes-filters">
      <div className="admin-delivery-sites">
        <SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={[allSites, ...sites.data]} selected={site} disabled={lockSite} onSelected={setSite}/>
      </div>
      <div className="admin-notes-dates">
        <DateField label="Od" value={from} onChange={value => { setFrom(value); if (value > to) setTo(value); }}/>
        <DateField label="Do" value={to} onChange={value => { setTo(value); if (value < from) setFrom(value); }}/>
      </div>
      <div className="admin-delivery-quick-dates">
        <button type="button" onClick={() => quickDate(-1)}><Icon name="ic_calendar"/>Juče</button>
        <button type="button" onClick={() => quickDate(0)}><Icon name="ic_calendar"/>Danas</button>
      </div>
    </div>
    
    <h2>Dnevni unosi</h2>
    {notes.error ? null
      : !sorted.length ? <Notice>Nema dnevnih unosa za izabrani period.</Notice>
      : <div className="admin-notes-list">{sorted.map(note => {
        const photo = note.getAttachments()[0];
        return <article className="admin-note-card" key={note.getId()} role="button" tabIndex={0} onClick={() => setSelected(note)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setSelected(note); } }}>
          <div className="admin-note-copy">
            <time>{note.getDate()}</time>
            <strong>{(site === allSites ? note.getConstructionSiteName() : site?.getName()) || '-'}</strong>
            <p>{note.getNote()}</p>
            <small>Dodao: {note.getManager() || '-'}</small>
            <div className="admin-note-workers"><Icon name="ic_workers_black_no_bg_original_proportions"/><span>Radnika na gradilištu: {note.getWorkerCount()}</span></div>
          </div>
          <div className="admin-note-thumbnail">{photo ? <AuthenticatedImage url={photo.getUrl()} alt="Fotografija dnevnog unosa"/> : <Icon name="ic_diary" className="admin-note-placeholder"/>}</div>
        </article>;
      })}</div>}
  </section>;
}
