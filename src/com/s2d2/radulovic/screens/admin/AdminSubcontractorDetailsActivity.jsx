import LoadFailureToast from '../../LoadFailureToast.jsx';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import AdminEditSubcontractorActivity from './AdminEditSubcontractorActivity.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import { Title, Icon, MaterialIcon, DateRange, Notice, useLoad, monthStart, today } from './AdminShared.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminSubcontractorDetailsActivity.css';

const text = value => String(value ?? '').trim() || '-';
const hours = minutes => minutes == null ? '-' : Math.trunc(minutes / 60) + 'h' + (minutes % 60 ? ' ' + minutes % 60 + 'min' : '');
function duration(from, to) {
  const valid = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!valid(from) || !valid(to)) return null;
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  return (minutes(to) - minutes(from) + 1440) % 1440;
}
function entryOf(record) {
  const from = text(record.getStartedAt()), to = text(record.getFinishedAt()), minutes = duration(from, to);
  // Android parses the calendar-date prefix even when the API includes a timestamp.
  const date = (record.getDate() || '').slice(0, 10);
  return { id: record.getSubcontractorAttendanceId(), date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(8, 10) + '.' + date.slice(5, 7) + '.' + date.slice(0, 4) + '.' : '-',
    site: text(record.getConstructionSite()), manager: record.getManagerName() === 'null' ? '-' : text(record.getManagerName()), from, to,
    workers: record.getNumberOfWorkers(), minutes, workerMinutes: minutes == null ? null : minutes * record.getNumberOfWorkers(), note: record.getNote() === 'null' ? '' : record.getNote() || '' };
}
export default function AdminSubcontractorDetailsActivity({ subcontractor, onBack, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [identityVersion, setIdentityVersion] = useState(0);
  useForegroundRefresh(() => setIdentityVersion(value => value + 1), !editing);
  const [identity, setIdentity] = useState(subcontractor);
  const [from, setFrom] = useState(monthStart), [to, setTo] = useState(today);
  const [tab, setTab] = useState(0), [expanded, setExpanded] = useState(null), [site, setSite] = useState(null), [preview, setPreview] = useState(null);
  useBackLayer(true, onBack);
  useEffect(() => {
    let live = true;
    Session.getAllSubcontractorsFromServer({ onSuccess(items) { const updated = items.find(item => item.getSubcontractorId() === subcontractor.getSubcontractorId()); if (live && updated) setIdentity(updated); }, onFailure() {} });
    return () => { live = false; };
  }, [subcontractor, identityVersion]);
  const state = useLoad(cb => DailyLogUtils.getAdminSubcontractorAttendancesFromServer(subcontractor.getSubcontractorId(), from, to, {
    onSuccess(records, perSite) {
      const sorted = items => [...items].sort((a, b) => (b.getDate() || '').localeCompare(a.getDate() || ''));
      const entries = sorted(records).map(entryOf), byId = new Map(entries.map(entry => [entry.id, entry]));
      const groups = [...perSite].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, items]) => {
        const rows = sorted(items).map(item => byId.get(item.getSubcontractorAttendanceId())).filter(Boolean);
        return { name, entries: rows, days: new Set(rows.map(entry => entry.date)).size, minutes: rows.reduce((sum, entry) => sum + (entry.minutes || 0), 0),
          workerMinutes: rows.reduce((sum, entry) => sum + (entry.workerMinutes || 0), 0), notes: rows.filter(entry => entry.note.trim()).length };
      });
      cb.onSuccess({ entries, groups });
    }, onFailure: cb.onFailure,
  }), [subcontractor.getSubcontractorId(), from, to], { entries: [], groups: [] });
  const { entries, groups } = state.data;
  const phone = identity.getPhoneNumber().trim();
  function dates(a, b) { setFrom(a); setTo(b); setExpanded(null); setSite(null); setPreview(null); }
  if (editing) return <AdminEditSubcontractorActivity subcontractor={identity} onBack={() => setEditing(false)} onSaved={() => { setEditing(false); setIdentityVersion(value => value + 1); onUpdated(); }}/>;
  return <section className="admin-screen admin-subcontractor-details">
    <Title title="AKTIVNOST PODIZVOĐAČA" subtitle="Pregled angažovanja podizvođača po izabranom periodu." icon="ic_workers_black_no_bg_original_proportions"/>
    <div className="subdetail-identity"><div><small>Naziv</small><strong>{text(identity.getName())}</strong><p>Podizvođač <span> • </span><b style={{ color: identity.isActive() ? '#0e8a3a' : '#e00015' }}>{identity.isActive() ? 'Aktivan' : 'Neaktivan'}</b></p></div>
      <div className="subdetail-identity-right"><button type="button" onClick={() => setEditing(true)}><MaterialIcon name="edit" size={17}/>Izmeni</button>
        {phone ? <a href={'tel:' + phone}><small>Broj telefona</small><strong>{phone}</strong></a> : <div><small>Broj telefona</small><strong>-</strong></div>}
      </div>
    </div>
    <DateRange from={from} to={to} onChange={dates}/>
    {!state.loading && !state.error && groups.length > 0 && <div className="subdetail-summary"><header><span>Gradilište</span><span>Broj dana</span></header>{groups.map(group => <div key={group.name}><strong>{group.name}</strong><b>{group.days}</b></div>)}</div>}
    <div className="subdetail-tabs" role="tablist">{['AKTIVNOSTI', 'PO GRADILIŠTIMA'].map((label, index) => <button type="button" role="tab" key={label} aria-selected={tab === index} onClick={() => { if (tab !== index) { setTab(index); setExpanded(null); setSite(null); } }}>{label}</button>)}</div>
    {state.loading ? <Notice>Učitavanje...</Notice> : state.error ? <LoadFailureToast message="Učitavanje aktivnosti nije uspelo."/> : !entries.length || (tab === 1 && !groups.length) ? <Notice>{tab === 0 ? 'Nema aktivnosti za izabrani period.' : 'Nema gradilišta za izabrani period.'}</Notice> :
      tab === 0 ? <div className="subdetail-list"><h2>Evidencija aktivnosti</h2>{entries.map(entry => <Card key={entry.id} expanded={expanded === entry.id}>
        <button type="button" className="subdetail-entry-heading" aria-expanded={expanded === entry.id} onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}><strong>{entry.date}</strong><span/><b>{entry.site}</b></button>
        <button type="button" className="subdetail-manager" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>Dodao: {entry.manager}</button>
        {expanded === entry.id && <Gesture className="subdetail-entry-body" entry={entry} onPreview={setPreview}>
          <div className="subdetail-metrics"><Metric label="Od" value={entry.from} clock/><Metric label="Do" value={entry.to} clock/></div>
          <div className="subdetail-metrics"><Metric label="Broj radnika" value={String(entry.workers)} icon="ic_workers_black_no_bg_original_proportions"/><Metric label="Radnik-sat" value={hours(entry.workerMinutes)} icon="ic_worker_hour"/></div>
          <div className="subdetail-entry-note"><small>Napomena</small><strong>{text(entry.note)}</strong></div>
        </Gesture>}
      </Card>)}</div> : <div className="subdetail-list">{groups.map(group => <Card key={group.name} expanded={site === group.name}>
        <button className="subdetail-site-heading" type="button" aria-expanded={site === group.name} onClick={() => setSite(site === group.name ? null : group.name)}>
          <span><strong>{group.name}</strong><img className="app-chevron" style={{ transform: site === group.name ? 'rotate(-90deg)' : undefined }} src="/assets/drawable/ic_chevron_right.svg" alt={site === group.name ? 'Sakrij gradilište' : 'Prikaži gradilište'}/></span>
          <div className="subdetail-site-metrics">{[['Dana', group.days], ['Sati', hours(group.minutes)], ['Napomene', group.notes], ['Radnik-sati', hours(group.workerMinutes)]].map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div>
        </button>
        {site === group.name && <div className="subdetail-site-entries">{group.entries.map(entry => <Gesture key={entry.id} className="subdetail-site-entry" entry={entry} onPreview={setPreview}>
          <div className="subdetail-site-entry-values">{[['Datum', entry.date], ['Od', entry.from], ['Do', entry.to], ['Broj radnika', entry.workers], ['Napomena', text(entry.note)]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
          <div className="subdetail-manager">Dodao: {entry.manager}</div>
        </Gesture>)}</div>}
      </Card>)}</div>}
    {preview && <Preview entry={preview.entry} held={preview.held} onClose={() => setPreview(null)}/>}
  </section>;
}
function Card({ expanded, children }) {
  const ref = useRef(null);
  useEffect(() => { if (!expanded) return; const timer = setTimeout(() => ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50); return () => clearTimeout(timer); }, [expanded]);
  return <article ref={ref} className={'subdetail-card' + (expanded ? ' expanded' : '')}>{children}</article>;
}
function Metric({ label, value, icon, clock }) {
  return <div>{clock ? <MaterialIcon name="clock" size={18}/> : <Icon name={icon}/>}<small>{label}</small><strong>{value}</strong></div>;
}
function Gesture({ entry, onPreview, children, className }) {
  const press = useRef(null);
  useEffect(() => () => clearTimeout(press.current?.timer), []);
  function down(event) { if (event.button !== 0) return; const point = { x: event.clientX, y: event.clientY, held: false }; point.timer = setTimeout(() => { point.held = true; onPreview({ entry, held: true }); }, 500); press.current = point; event.currentTarget.setPointerCapture(event.pointerId); }
  function move(event) { const point = press.current; if (point && !point.held && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 8) { clearTimeout(point.timer); press.current = null; } }
  function release(cancelled) { const point = press.current; if (!point) return; clearTimeout(point.timer); press.current = null; if (point.held) onPreview(null); else if (!cancelled) onPreview({ entry, held: false }); }
  return <div role="button" tabIndex={0} aria-label="Pregled aktivnosti" className={className} onPointerDown={down} onPointerMove={move} onPointerUp={() => release(false)} onPointerCancel={() => release(true)} onContextMenu={event => event.preventDefault()} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPreview({ entry, held: false }); } }}>{children}</div>;
}
function Preview({ entry, held, onClose }) {
  const ref = useRef(null);
  useBackLayer(!held, onClose);
  useEffect(() => { const previous = document.body.style.overflow, node = ref.current; document.body.style.overflow = 'hidden'; if (!held) node.showModal(); return () => { document.body.style.overflow = previous; if (!held) node.close(); }; }, [held]);
  const info = (label, value) => <div className="subdetail-preview-info"><span>{label}</span><strong>{text(value)}</strong></div>;
  const content = <div className="subdetail-preview-card"><div className="subdetail-preview-content"><h2>PREGLED AKTIVNOSTI</h2>
    {info('Datum:', entry.date)}{info('Gradilište:', entry.site)}{info('Dodao:', entry.manager)}
    <div className="subdetail-preview-pair">{info('Od:', entry.from)}{info('Do:', entry.to)}</div>
    <div className="subdetail-preview-pair">{info('Broj radnika:', entry.workers)}{info('Radnih sati:', hours(entry.minutes))}</div>
    {info('Radnik-sati:', hours(entry.workerMinutes))}<div className="subdetail-preview-note"><span>Napomena:</span><p>{text(entry.note)}</p></div>
  </div></div>;
  return held ? <div className="subdetail-held-preview">{content}</div> : <dialog ref={ref} className="subdetail-preview" aria-label="Pregled aktivnosti" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{content}</dialog>;
}
