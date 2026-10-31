import React, { useState } from 'react';
import AdminDeliveryNoteDetails from './AdminDeliveryNoteDetails.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import Session from '../../network/Session.js';
import TimeUtils from '../../utils/TimeUtils.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import { Title, Icon, Search, Notice, DateField, useLoad, today, monthStart } from './AdminShared.jsx';
import './AdminDeliveryNotesActivity.css';

const allSites = { isAllSites: true, getId: () => -1, getName: () => 'Sva gradilišta' };
export default function AdminDeliveryNotesActivity({ onBack, initialSite, initialFrom, initialTo, lockSite = false } = {}) {
  const [site, setSite] = useState(() => initialSite ?? Session.getDefaultConstructionSite());
  const [from, setFrom] = useState(() => initialFrom ?? monthStart());
  const [to, setTo] = useState(() => initialTo ?? today());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  useBackLayer(!!selected, () => setSelected(null));
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const notes = useLoad(cb => {
    if (!site) { cb.onSuccess([]); return; }
    Session.getDeliveryNotesAdmin(site === allSites ? null : site, from, to, cb);
  }, [site, from, to], []);
  const filtered = notes.data.filter(note => [note.getName(), note.getDescription(), note.getSupplierName(), note.getConstructionSiteName()]
    .some(value => (value || '').toLocaleLowerCase().includes(search.toLocaleLowerCase())));
  function quickDate(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const value = TimeUtils.formatDate(date);
    setFrom(value); setTo(value);
  }
  if (selected) return <AdminDeliveryNoteDetails note={selected} onBack={() => setSelected(null)}/>;
  return <section className="admin-screen admin-delivery-notes">
    <Title title="OTPREMNICE" subtitle="Pregled otpremnica materijala." icon="ic_document_lines_black" onBack={onBack}/>
    <div className="admin-delivery-sites">
      <SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={[allSites, ...sites.data]} selected={site} disabled={lockSite} onSelected={setSite}/>
    </div>
    
    <div className="admin-delivery-dates">
      <div className="admin-delivery-date-fields">
        <DateField label="Od" value={from} onChange={value => { setFrom(value); if (value > to) setTo(value); }}/>
        <DateField label="Do" value={to} onChange={value => { setTo(value); if (value < from) setFrom(value); }}/>
      </div>
      <div className="admin-delivery-quick-dates">
        <button type="button" onClick={() => quickDate(-1)}><Icon name="ic_calendar"/>Juče</button>
        <button type="button" onClick={() => quickDate(0)}><Icon name="ic_calendar"/>Danas</button>
      </div>
    </div>
    <Search value={search} onChange={setSearch} placeholder="Pretraži otpremnice..."/>
    {!site ? <Notice>Nije odabrano gradilište.</Notice>
      : notes.loading ? <Notice>Učitavanje otpremnica...</Notice>
      : notes.error ? null
      : !filtered.length ? <Notice>Nema otpremnica za izabrani filter.</Notice>
      : <div className="admin-delivery-list">{filtered.map(note => <button type="button" className="admin-delivery-note" key={note.getId()} onClick={() => setSelected(note)}>
        <div className={'admin-delivery-thumbnail' + (!note.getUrl() ? ' no-image' : '')}><AuthenticatedImage url={note.getUrl()}/></div>
        <div className="admin-delivery-note-copy">
          <strong>{note.getName()}</strong>
          <small>{/^\d{4}-\d{2}-\d{2}/.test(note.getDate()) ? dateLabel(note.getDate().slice(0, 10)) : note.getDate()}</small>
          <span>{note.getConstructionSiteName() || '-'}</span>
          <div><Icon name="ic_manager"/><small>{note.getManagerName() || '-'}</small></div>
        </div>
        <Icon name="ic_chevron_right" className="admin-delivery-chevron"/>
      </button>)}</div>}
  </section>;
}
