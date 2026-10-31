import LoadFailureToast from '../../LoadFailureToast.jsx';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import AdminEditExcavatorActivity from './AdminEditExcavatorActivity.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import { Title, Icon, MaterialIcon, DateRange, Notice, useLoad, today, monthStart } from './AdminShared.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import './AdminExcavatorDetailsActivity.css';

const text = value => value?.trim() || '-';
const number = value => value == null || !String(value).trim() || !Number.isFinite(Number(value)) ? null : Number(value);
const hours = value => value == null ? '-' : Number.isInteger(value) ? String(value) : value.toFixed(1);
const dateKey = date => { const parts = date.split('.'); return parts.length >= 3 ? parts[2] + parts[1] + parts[0] : ''; };
const total = entry => entry.start == null || entry.end == null ? '-' : hours(Math.max(0, entry.end - entry.start));

export default function AdminExcavatorDetailsActivity({ machine, onBack, onUpdated }) {
  const [from, setFrom] = useState(monthStart), [to, setTo] = useState(today);
  const [editing, setEditing] = useState(false);
  const [identityVersion, setIdentityVersion] = useState(0);
  useForegroundRefresh(() => setIdentityVersion(value => value + 1), !editing);
  const [identity, setIdentity] = useState(machine);
  const [expanded, setExpanded] = useState(null), [preview, setPreview] = useState(null);
  useBackLayer(true, onBack);
  const logs = useLoad(cb => Session.getExcavatorLogsAdmin(machine.getMachineId(), from, to, cb), [machine.getMachineId(), from, to], []);
  useEffect(() => {
    let live = true;
    Session.getAllMachinesFromServer({ onSuccess(items) { const updated = items.find(item => item.getMachineId() === machine.getMachineId()); if (live && updated) setIdentity(updated); }, onFailure() {} });
    return () => { live = false; };
  }, [machine, identityVersion]);
  const entries = (logs.loading ? [] : logs.data).map(log => ({ id: log.getExcavatorLogId(), date: log.getDate() || '', site: log.getConstructionSiteName(), operator: log.getOperatorName(),
    start: number(log.getStartHours()), end: number(log.getEndHours()), note: /^null$/i.test(log.getManagerNote() || '') ? '' : log.getManagerNote() || '' }))
    .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
  const incomplete = entry => entry.start == null || entry.end == null;
  const status = ({ inactive: ['Neaktivan', '#e00015'], service: ['Servis', '#c98200'], maintenance: ['Servis', '#c98200'] })[identity.getStatus()?.toLowerCase()] || ['Aktivan', '#0e8a3a'];
  const summaries = [
    ['Dana radio', entries.length ? String(entries.length) : '-', 'dana', 'blue', 'calendar'],
    ['Sati radio', entries.length ? hours(entries.reduce((sum, entry) => sum + (incomplete(entry) ? 0 : entry.end - entry.start), 0)) + 'h' : '-', 'ukupno', 'green', 'clock'],
    ['Radni sati', entries[0]?.end == null ? '-' : hours(entries[0].end) + 'h', 'radnih sati', 'gold', 'excavator'],
    ['Nepotpuni unosi', entries.length ? String(entries.filter(incomplete).length) : '-', 'unosa', 'red', 'warning'],
  ];
  function dates(a, b) { setFrom(a); setTo(b); setExpanded(null); setPreview(null); }
  if (editing) return <AdminEditExcavatorActivity machine={identity} onBack={() => setEditing(false)} onSaved={() => { setEditing(false); setIdentityVersion(value => value + 1); onUpdated(); }}/>;
  return <section className="admin-screen admin-excavator-details">
    <Title title="AKTIVNOST BAGERA" subtitle="Pregled aktivnosti radne mašine." icon="ic_excavator_black"/>
    <div className="excavator-identity"><div><small>Mašina</small><strong>{text(identity.getName())}</strong><p>Bager <span> • </span><b style={{ color: status[1] }}>{status[0]}</b></p></div>
      <div className="excavator-identity-right"><button type="button" onClick={() => setEditing(true)}><MaterialIcon name="edit" size={17}/>Izmeni</button><div><small>Registarska tablica</small><strong>{text(identity.getLicensePlate())}</strong></div></div>
    </div>
    <DateRange from={from} to={to} onChange={dates}/>
    <div className="excavator-summary-grid">{summaries.map(([label, value, unit, color, icon]) => <div key={label} className={'excavator-summary ' + color}>
      <div><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>
      {icon === 'excavator' ? <i className="excavator-summary-icon"/> : icon === 'calendar' ? <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 16h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg> : <MaterialIcon name={icon} size={25}/>}
    </div>)}</div>
    {logs.loading ? <Notice>Učitavanje evidencije...</Notice> : logs.error ? <LoadFailureToast message="Učitavanje evidencije nije uspelo."/> : !entries.length ? <Notice>Nema evidencije za izabrani period.</Notice> :
      <div className="excavator-activity-list">{entries.map((entry, index) => <ActivityRow key={entry.id} entry={entry} expanded={expanded === index} onToggle={() => setExpanded(expanded === index ? null : index)} onPreview={setPreview}/>)}</div>}
    {preview && <Preview entry={preview.entry} held={preview.held} onClose={() => setPreview(null)}/>}
  </section>;
}
function ActivityRow({ entry, expanded, onToggle, onPreview }) {
  const card = useRef(null), press = useRef(null);
  useEffect(() => { if (!expanded) return; const timer = setTimeout(() => card.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50); return () => clearTimeout(timer); }, [expanded]);
  useEffect(() => () => clearTimeout(press.current?.timer), []);
  function down(event) {
    if (event.button !== 0) return;
    const point = { x: event.clientX, y: event.clientY, held: false };
    point.timer = setTimeout(() => { point.held = true; onPreview({ entry, held: true }); }, 500);
    press.current = point; event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) { const point = press.current; if (point && !point.held && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 8) { clearTimeout(point.timer); press.current = null; } }
  function release(cancelled) { const point = press.current; if (!point) return; clearTimeout(point.timer); press.current = null; if (point.held) onPreview(null); else if (!cancelled) onPreview({ entry, held: false }); }
  return <article ref={card} className={'excavator-activity' + (expanded ? ' expanded' : '')}>
    <button type="button" className="excavator-entry-heading" onClick={onToggle} aria-expanded={expanded}><strong>{text(entry.date)}</strong><span className="excavator-incomplete">{(entry.start == null || entry.end == null) && <span aria-label="Nepotpun unos"><MaterialIcon name="warning" size={20}/></span>}</span><span className="excavator-entry-site">{text(entry.site)}</span></button>
    <button type="button" className="excavator-entry-operator" onClick={onToggle}>Bagerista: {text(entry.operator)}</button>
    {expanded && <div className="excavator-entry-body" role="button" tabIndex={0} aria-label="Pregled rada bagera" onPointerDown={down} onPointerMove={move} onPointerUp={() => release(false)} onPointerCancel={() => release(true)} onContextMenu={event => event.preventDefault()} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPreview({ entry, held: false }); } }}>
      <div className="excavator-entry-values">{[['Sati početak', hours(entry.start)], ['Sati kraj', hours(entry.end)], ['Ukupno radnih sati', total(entry)]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className="excavator-entry-note"><small>Napomena</small><strong>{text(entry.note)}</strong></div>
    </div>}
  </article>;
}
function Preview({ entry, held, onClose }) {
  const ref = useRef(null);
  useBackLayer(!held, onClose);
  useEffect(() => { const previous = document.body.style.overflow, node = ref.current; document.body.style.overflow = 'hidden'; if (!held) node.showModal(); return () => { document.body.style.overflow = previous; if (!held) node.close(); }; }, [held]);
  const info = (label, value) => <div className="excavator-preview-info"><span>{label}</span><strong>{text(value)}</strong></div>;
  const content = <div className="excavator-preview-card"><div className="excavator-preview-content"><h2>PREGLED RADA BAGERA</h2>
    {info('Datum:', entry.date)}{info('Gradilište:', entry.site)}{info('Bagerista:', entry.operator)}
    <div className="excavator-preview-hours">{info('Sati početak:', hours(entry.start))}{info('Sati kraj:', hours(entry.end))}</div>
    {info('Ukupno radnih sati:', total(entry))}<div className="excavator-preview-note"><span>Napomena:</span><p>{text(entry.note)}</p></div>
  </div></div>;
  return held ? <div className="excavator-held-preview">{content}</div> : <dialog ref={ref} className="excavator-preview" aria-label="Pregled rada bagera" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{content}</dialog>;
}
