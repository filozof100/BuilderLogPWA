import { showToast } from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import WebUtils from '../../network/WebUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import SubcontractorAttendance from '../../attendances/SubcontractorAttendance.js';
import StandardSiteDateControls from '../../ui/components/StandardSiteDateControls.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { TimePicker, dateLabel, dayLabel } from '../../ui/components/AttendancePickers.jsx';
import './WorkersActivity.css';
import './DeliveryNotesActivity.css';
import './ManagerMachinesScreen.css';
import './SubcontractorsActivity.css';

function rowFor(model, log) {
  const attendance = model.getAttendance(log.getDailyLogId());
  return { model, id: model.getSubcontractorId(), name: model.getName(), attendance,
    from: attendance?.getStartedAt() || '-', to: attendance?.getFinishedAt() || '-',
    count: attendance?.getNumberOfWorkers() > 0 ? String(attendance.getNumberOfWorkers()) : '-', note: attendance?.getNote() || '' };
}
export default function SubcontractorsActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite()), [date, setDate] = useState(() => TimeUtils.formatDate(new Date()));
  const [sites, setSites] = useState([]), [log, setLog] = useState(null), [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [sitesError, setSitesError] = useState('');
  const [retry, setRetry] = useState(0), [search, setSearch] = useState(''), [expanded, setExpanded] = useState(null), [editor, setEditor] = useState(null), [removing, setRemoving] = useState(null);
  const lock = useRef(false);
  useEffect(() => {
    let active = true; setSitesError('');
    Session.getAssignedSitesFromServer({ onSuccess(items) { if (active) setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]); },
      onFailure() { if (active) setSitesError('Učitavanje gradilišta nije uspelo.'); } });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true; setLog(null); setRows([]); setExpanded(null); setError(''); setLoading(!!site);
    const fail = () => { if (active) { setLoading(false); setError('Učitavanje podizvođača nije uspelo.'); } };
    if (site) DailyLogUtils.createOrUpdateDailyLog(site, date, {
      onSuccess(dailyLog) {
        if (!active) return;
        DailyLogUtils.getSubcontractorsWithAttendance(dailyLog, {
          onSuccess(items) { if (active) { setLog(dailyLog); setRows(items.map(item => rowFor(item, dailyLog))); setLoading(false); } }, onFailure: fail,
        });
      }, onFailure: fail,
    });
    return () => { active = false; };
  }, [site, date, retry]);
  function edit(row) { setExpanded(null); setError(''); setEditor(row); }
  function save(from, to, count, note) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const fail = () => { lock.current = false; setBusy(false); setError('Čuvanje evidencije rada nije uspelo.'); };
    const done = attendance => {
      editor.model.setAttendance(log.getDailyLogId(), attendance);
      setRows(previous => previous.map(row => row.id === editor.id ? rowFor(editor.model, log) : row));
      setEditor(null); lock.current = false; setBusy(false);
    };
    try {
      if (editor.attendance) {
        const id = editor.attendance.getSubcontractorAttendanceId();
        DailyLogUtils.updateSubcontractorAttendance(log, id, from, to, count, note, {
          onSuccess() { done(new SubcontractorAttendance(id, log.getDailyLogId(), editor.id, from, to, Number(count) || 0, note)); }, onFailure: fail,
        });
      } else DailyLogUtils.createSubcontractorAttendance(log, editor.id, from, to, count, note, { onSuccess: done, onFailure: fail });
    } catch { fail(); }
  }
  function remove(reason) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const fail = () => { lock.current = false; setBusy(false); setError('Brisanje evidencije rada nije uspelo.'); };
    try {
      WebUtils.sendDELETERequest('daily-logs/' + log.getDailyLogId() + '/subcontractors/' + removing.attendance.getSubcontractorAttendanceId(), JSON.stringify({ reason }), { Authorization: Session.getSessionToken() }, {
        onSuccess() {
          removing.model.removeAttendance(log.getDailyLogId());
          setRows(previous => previous.map(row => row.id === removing.id ? rowFor(removing.model, log) : row));
          setRemoving(null); lock.current = false; setBusy(false);
        }, onFailure: fail,
      });
    } catch { fail(); }
  }
  const filtered = rows.filter(row => row.name.toLowerCase().startsWith(search.toLowerCase())).sort((a, b) => Number(!!b.attendance) - Number(!!a.attendance) || a.name.localeCompare(b.name));
  return <section className="manager-subcontractors">
    <header className="delivery-title subcontractor-title"><span><img src="/assets/drawable/ic_workers_black_no_bg_original_proportions.svg" alt="" /></span><div><h1>PODIZVOĐAČI</h1><p>Pregled podizvođača po gradilištu i datumu.</p></div></header>
    <StandardSiteDateControls sites={sites} site={site} onSiteSelected={setSite} date={date} onDateSelected={setDate} disabled={loading || busy} />
    <label className="subcontractor-search"><img src="/assets/drawable/ic_search.svg" alt="" /><input aria-label="Pretraži podizvođače" placeholder="Pretraži podizvođače..." value={search} onFocus={() => setExpanded(null)} onChange={event => setSearch(event.target.value)} /></label>
    
    {loading || !filtered.length ? <p className="delivery-notice">{loading ? 'Učitavanje podizvođača...' : 'Nema dostupnih podizvođača.'}</p> : <div className="subcontractor-list">{filtered.map(row => <article className={'subcontractor-card machine-card' + (row.attendance ? ' machine-worked' : '')} key={row.id}>
      <div className="machine-card-heading"><label className="machine-checkbox"><input type="checkbox" checked={!!row.attendance} disabled={!log} aria-label={(row.attendance ? 'Ukloni: ' : 'Evidentiraj: ') + row.name} onChange={() => { setExpanded(null); setError(''); row.attendance ? setRemoving(row) : setEditor(row); }} /></label>
        <button aria-expanded={expanded === row.id} onClick={() => setExpanded(expanded === row.id ? null : row.id)}><span><strong>{row.name}</strong><small>{row.attendance ? 'Aktivan' : 'Nije aktivan'}</small></span><img src={'/assets/drawable/ic_chevron_' + (expanded === row.id ? 'down' : 'right') + '.svg'} alt="" /></button>
      </div>
      {expanded === row.id && <div className="machine-card-body"><div className="machine-values subcontractor-values">{[['Od', row.from], ['Do', row.to], ['Broj radnika', row.count]].map(([label, value]) => <label key={label}>{label}<button onClick={() => edit(row)}>{value}</button></label>)}</div>
        <label className="machine-note-display">Napomena<button className={!row.note ? 'empty' : ''} onClick={() => edit(row)}>{row.note || 'Dodaj napomenu'}</button></label>
      </div>}
    </article>)}</div>}
    {editor && <AttendanceEditor row={editor} date={date} site={site} busy={busy} error={error} onClose={() => { setEditor(null); setError(''); }} onSave={save} />}
    {removing && <RemovalDialog row={removing} date={date} site={site} busy={busy} error={error} onClose={() => { setRemoving(null); setError(''); }} onConfirm={remove} />}
  </section>;
}
function AttendanceEditor({ row, date, site, busy, error, onClose, onSave }) {
  const [from, setFrom] = useState(row.from), [to, setTo] = useState(row.to), [count, setCount] = useState(row.count), [note, setNote] = useState(row.note);
  const [timeField, setTimeField] = useState(null), [countDraft, setCountDraft] = useState(null), [validation, setValidation] = useState('');
  function save() {
    if (!from || from === '-') { showToast('Morate odabrati pocetno vreme.'); return; }
    setValidation(''); onSave(from, to, count, note);
  }
  return <><Modal className="worker-editor subcontractor-editor" title="Evidencija rada" busy={busy} onClose={onClose} actions={<><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button><button className="text-button confirm-button" disabled={busy} onClick={save}>{busy ? 'Čuvanje...' : 'Sačuvaj'}</button></>}>
    <div className="worker-editor-person"><strong>{row.name}</strong><small>{dateLabel(date)} {dayLabel(date)} • {site?.getName()}</small></div>
    {[['Od', from, setFrom, ['07:00', '08:00', '09:00']], ['Do', to, setTo, ['15:00', '16:00', '17:00']]].map(([label, value, change, presets]) => <div className="worker-time-section" key={label}><label>{label}</label><div><button className="worker-time-value" aria-label={label} disabled={busy} onClick={() => setTimeField(label)}>{value}</button>{presets.map(preset => <button key={preset} disabled={busy} aria-pressed={value === preset} onClick={() => { change(preset); setValidation(''); }}>{preset}</button>)}</div></div>)}
    <div className="worker-time-section subcontractor-count-section"><label>Broj radnika</label><div><button className="worker-time-value" aria-label="Broj radnika" disabled={busy} onClick={() => setCountDraft(count === '-' ? '10' : count)}>{count}</button>{['5', '10', '15'].map(preset => <button key={preset} disabled={busy} aria-pressed={count === preset} onClick={() => setCount(preset)}>{preset}</button>)}</div></div>
    <label className="worker-reason subcontractor-editor-note">Napomena<textarea aria-label="Napomena" placeholder="Dodaj napomenu" value={note} disabled={busy} onChange={event => setNote(event.target.value)} autoCapitalize="sentences" /></label>
    {validation && <p className="error-message" role="alert">{validation}</p>}
  </Modal>
    {timeField && <TimePicker title={timeField} value={(timeField === 'Od' ? from : to) === '-' ? (timeField === 'Od' ? '08:00' : '16:00') : timeField === 'Od' ? from : to} onClose={() => setTimeField(null)} onConfirm={value => { (timeField === 'Od' ? setFrom : setTo)(value); setValidation(''); setTimeField(null); }} />}
    {countDraft !== null && <Modal className="subcontractor-count-dialog" title="Broj radnika" onClose={() => setCountDraft(null)} actions={<><button className="text-button" onClick={() => setCountDraft(null)}>Otkaži</button><button className="text-button confirm-button" onClick={() => { const value = Math.min(100, Number(countDraft)); setCount(value > 0 ? String(value) : '-'); setCountDraft(null); }}>OK</button></>}>
      <label>Broj radnika<input aria-label="Broj radnika" inputMode="numeric" value={countDraft} onChange={event => setCountDraft(event.target.value.replace(/\D/g, '').slice(0, 3))} /></label>
    </Modal>}
  </>;
}
function RemovalDialog({ row, date, site, busy, error, onClose, onConfirm }) {
  const [reason, setReason] = useState(''), [validation, setValidation] = useState('');
  return <Modal className="worker-editor worker-removal subcontractor-removal" title="Brisanje evidencije rada" busy={busy} onClose={onClose} actions={<><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button><button className="text-button remove-confirm" disabled={busy} onClick={() => { if (!reason.trim()) showToast('Morate uneti razlog.'); else { setValidation(''); onConfirm(reason.trim()); } }}>Potvrdi</button></>}>
    <p>Unesite razlog za brisanje evidencije rada.</p><div className="worker-editor-person"><strong>Podizvođač: {row.name}</strong><small>{dateLabel(date)} • {site?.getName()}</small></div>
    <label className="worker-reason">Razlog<textarea aria-label="Razlog" placeholder="Unesite razlog..." value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>
    {validation && <p className="error-message" role="alert">{validation}</p>}
  </Modal>;
}
