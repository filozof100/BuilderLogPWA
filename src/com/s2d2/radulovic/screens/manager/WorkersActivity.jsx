import { withRsd } from '../../utils/MoneyDisplay.js';
import { showToast } from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import WebUtils from '../../network/WebUtils.js';
import WorkerAttendance from '../../attendances/WorkerAttendance.js';
import TimeUtils from '../../utils/TimeUtils.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { DatePicker, TimePicker, dateLabel, dayLabel, dateValue } from '../../ui/components/AttendancePickers.jsx';
import './WorkersActivity.css';

export default function WorkersActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [date, setDate] = useState(() => TimeUtils.formatDate(new Date()));
  const [sites, setSites] = useState([]);
  const [log, setLog] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sitesError, setSitesError] = useState('');
  const [retry, setRetry] = useState(0);
  const [siteRetry, setSiteRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [calendar, setCalendar] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    Session.getAssignedSitesFromServer({
      onSuccess(items) { if (active) { setSites([...items.filter(s => s.canSelect()), ...items.filter(s => !s.canSelect())]); setSitesError(''); } },
      onFailure() { if (active) setSitesError('Učitavanje gradilišta nije uspelo.'); },
    });
    return () => { active = false; };
  }, [siteRetry]);
  useEffect(() => {
    let active = true;
    setLog(null); setWorkers([]); setError('');
    if (!site) { setLoading(false); return () => { active = false; }; }
    setLoading(true);
    const fail = () => { if (active) { setLoading(false); setError('Učitavanje evidencije radnika nije uspelo.'); } };
    DailyLogUtils.createOrUpdateDailyLog(site, date, {
      onSuccess(dailyLog) {
        if (!active) return;
        setLog(dailyLog);
        DailyLogUtils.getAllPlainWorkersWithAttendance(dailyLog, {
          onSuccess(items) { if (active) { setWorkers(items); setLoading(false); } }, onFailure: fail,
        });
      }, onFailure: fail,
    });
    return () => { active = false; };
  }, [site, date, retry]);

  function refreshWorkers() {
    setLoading(true);
    DailyLogUtils.getAllPlainWorkersWithAttendance(log, {
      onSuccess(items) { setWorkers(items); setLoading(false); },
      onFailure() { setLoading(false); setError('Učitavanje evidencije radnika nije uspelo.'); },
    });
  }
  function save(from, to, advance) {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => { lock.current = false; setSaving(false); setError('Čuvanje evidencije rada nije uspelo.'); };
    const success = attendance => {
      editor.worker.setAttendance(log.getDailyLogId(), attendance);
      setWorkers(previous => [...previous]);
      lock.current = false; setSaving(false); setEditor(null);
      refreshWorkers();
    };
    try {
      if (editor.attendance) {
        const id = editor.attendance.getWorkerAttendanceId();
        DailyLogUtils.updateWorkerAttendance(log, id, from, to, advance, {
          onSuccess() {
            success(new WorkerAttendance(id, log.getDailyLogId(), editor.worker.getId(), editor.worker.getFirstName(), editor.worker.getLastName(),
              from === '-' ? 'null' : date + ' ' + from, to === '-' ? 'null' : date + ' ' + to, advance === '-' ? '0' : advance.replaceAll('.', '')));
          }, onFailure: fail,
        });
      } else DailyLogUtils.createWorkerAttendance(log, editor.worker, from, to, advance, { onSuccess: success, onFailure: fail });
    } catch { fail(); }
  }
  function remove(reason) {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => { lock.current = false; setSaving(false); setError('Brisanje evidencije rada nije uspelo.'); };
    try {
      WebUtils.sendDELETERequest('daily-logs/' + log.getDailyLogId() + '/worker-attendances/' + removing.attendance.getWorkerAttendanceId(),
        JSON.stringify({ reason }), { Authorization: Session.getSessionToken() }, {
          onSuccess() {
            removing.worker.removeAttendance(log.getDailyLogId()); removing.worker.setAvailableToday(true);
            setWorkers(previous => [...previous]); setRemoving(null); setSaving(false); lock.current = false;
            refreshWorkers();
          }, onFailure: fail,
        });
    } catch { fail(); }
  }
  function shiftDate(days) {
    const next = dateValue(date); next.setDate(next.getDate() + days); setDate(TimeUtils.formatDate(next));
  }
  function openEditor(row) { setError(''); setEditor(row); }
  const today = date === TimeUtils.formatDate(new Date());
  const rows = workers.map(worker => ({ worker, attendance: worker.getAttendance(log?.getDailyLogId()) }))
    .filter(row => row.worker.getFullName().toLowerCase().startsWith(search.toLowerCase()))
    .sort((a, b) => a.worker.getFullName() < b.worker.getFullName() ? -1 : a.worker.getFullName() > b.worker.getFullName() ? 1 : 0);
  const groups = [
    [(today ? 'Trenutno na gradilištu' : 'Radili na gradilištu') + ': ' + (site?.getName() || '-'), rows.filter(row => row.attendance), true, false],
    [today ? 'Trenutno slobodni' : 'Nisu radili', rows.filter(row => !row.attendance && row.worker.isAvailableToday()), false, false],
    [today ? 'Trenutno na drugom gradilištu' : 'Radili na drugom gradilištu', rows.filter(row => !row.attendance && !row.worker.isAvailableToday()), false, true],
  ];
  return <section className="manager-workers">
    <header className="workers-title">
      
      <img src="/assets/drawable/ic_workers_black_no_bg_original_proportions.svg" alt="" />
      <div><h1>RADNICI</h1><p>Pregled radnika, evidencija radnog vremena i akontacija.</p></div>
    </header>
    <div className="workers-site-card manager-site-picker">
      <SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={sites}
        selected={site} onSelected={setSite} optionEnabled={item => item.canSelect()} disabled={loading || saving} maxMenuHeight={180} />
      
    </div>
    <div className="workers-date-row">
      <button aria-label="Prethodni dan" disabled={loading || saving} onClick={() => shiftDate(-1)}><img className="app-chevron app-chevron-left" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button>
      <button aria-label="Kalendar" disabled={loading || saving} onClick={() => setCalendar(true)}><img src="/assets/drawable/ic_calendar.svg" alt="" /></button>
      <div><strong>{dateLabel(date)}</strong><small>{dayLabel(date)}</small></div>
      <button aria-label="Sledeći dan" disabled={loading || saving} onClick={() => shiftDate(1)}><img className="app-chevron" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button>
      <button className="workers-today" disabled={loading || saving} onClick={() => setDate(TimeUtils.formatDate(new Date()))}><img src="/assets/drawable/ic_calendar.svg" alt="" />Danas</button>
    </div>
    <label className="workers-search"><img src="/assets/drawable/ic_search.svg" alt="" /><input aria-label="Pretraži radnike" placeholder="Pretraži radnike..." value={search} onChange={event => setSearch(event.target.value)} /></label>
    
    {!loading && groups.map(([title, items, highlighted, collapsible]) => <WorkerSection key={title} title={title} rows={items} highlighted={highlighted} collapsible={collapsible}
      onEdit={openEditor} onRemove={row => { setError(''); setRemoving(row); }} />)}
    {calendar && <DatePicker date={date} onClose={() => setCalendar(false)} onConfirm={value => { setDate(value); setCalendar(false); }} />}
    {editor && <AttendanceEditor row={editor} date={date} site={site} busy={saving} error={error} onClose={() => { setEditor(null); setError(''); }} onSave={save} />}
    {removing && <RemovalDialog row={removing} date={date} site={site} busy={saving} error={error} onClose={() => { setRemoving(null); setError(''); }} onConfirm={remove} />}
  </section>;
}

function WorkerSection({ title, rows, highlighted, collapsible, onEdit, onRemove }) {
  const [expanded, setExpanded] = useState(!collapsible);
  return <section className={'worker-section' + (highlighted ? ' highlighted' : '')}>
    <button className="worker-section-title" disabled={!collapsible} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <span>{title}</span><strong>{rows.length}</strong>{collapsible && <img className="app-chevron" src={'/assets/drawable/ic_chevron_' + (expanded ? 'down' : 'right') + '.svg'} alt="" />}
    </button>
    {expanded && (!rows.length ? <div className="workers-empty">Nema radnika.</div> : rows.map(row => {
      const enabled = !!row.attendance || row.worker.isAvailableToday();
      const amount = Math.trunc(Number(row.attendance?.getAdvance()));
      const advance = amount ? Math.abs(amount).toLocaleString('de-DE') : '-';
      return <div key={row.worker.getId()} className={'worker-card' + (row.attendance ? ' present' : '') + (!enabled ? ' unavailable' : '')}>
        {row.attendance && <button className="worker-remove" aria-label={'Obriši evidenciju: ' + row.worker.getFullName()} onClick={() => onRemove(row)}>×</button>}
        <button className="worker-card-main" aria-label={'Evidencija: ' + row.worker.getFullName()} disabled={!enabled} onClick={() => onEdit(row)}>
          <strong>{row.worker.getFullName()}</strong>
          {[['Od', row.attendance?.getStartedAt()], ['Do', row.attendance?.getFinishedAt()], ['Ak.', advance]].map(([label, value]) =>
            <span className="worker-cell" key={label}><small>{label}</small><b>{enabled ? (label === 'Ak.' ? withRsd(value) : value || '-') : '-'}</b></span>)}
        </button>
      </div>;
    }))}
  </section>;
}
function AttendanceEditor({ row, date, site, busy, error, onClose, onSave }) {
  const [from, setFrom] = useState(row.attendance?.getStartedAt() || '-');
  const [to, setTo] = useState(row.attendance?.getFinishedAt() || '-');
  const [advance, setAdvance] = useState(() => {
    const amount = Math.trunc(Number(row.attendance?.getAdvance()));
    return amount ? amount.toLocaleString('de-DE') : '-';
  });
  const [timeField, setTimeField] = useState(null);
  const [validation, setValidation] = useState('');
  useEffect(() => { setValidation(''); }, [from, to]);
  function save() {
    if (from === '-' || !from) { showToast('Morate odabrati pocetno vreme.'); return; }
    if (to !== '-' && to && from >= to) { showToast('Vreme pocetka rada mora biti manje od vremena kraja rada.'); return; }
    setValidation(''); onSave(from, to, advance || '-');
  }
  return <><Modal className="worker-editor" title="Evidencija rada" busy={busy} onClose={onClose}
    actions={<><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button><button className="text-button confirm-button" disabled={busy} onClick={save}>{busy ? 'Čuvanje...' : 'Sačuvaj'}</button></>}>
    <div className="worker-editor-person"><strong>{row.worker.getFullName()}</strong><small>{dateLabel(date)} {dayLabel(date)} • {site?.getName()}</small></div>
    {[['Od', from, setFrom, ['07:00', '08:00', '09:00']], ['Do', to, setTo, ['15:00', '16:00', '17:00']]].map(([label, value, change, presets]) =>
      <div className="worker-time-section" key={label}><label>{label}</label><div>
        <button aria-label={'Izaberite vreme - ' + label} className="worker-time-value" onClick={() => setTimeField(label)}>{value}</button>
        {presets.map(preset => <button key={preset} aria-pressed={value === preset} onClick={() => change(preset)}>{preset}</button>)}
      </div></div>)}
    <label className="worker-advance">Akontacija<span><input aria-label="Akontacija" inputMode="numeric" value={advance}
      onFocus={() => { if (advance === '-') setAdvance(''); }} onBlur={() => { if (!advance) setAdvance('-'); }}
      onChange={event => { const digits = event.target.value.replace(/\D/g, ''); setAdvance(digits ? BigInt(digits).toLocaleString('de-DE') : ''); }} /><small>RSD</small></span></label>
    {validation && <p className="error-message" role="alert">{validation}</p>}
  </Modal>
  {timeField && <TimePicker title={timeField} value={(timeField === 'Od' ? from : to) === '-' ? (timeField === 'Od' ? '08:00' : '16:00') : timeField === 'Od' ? from : to}
    onClose={() => setTimeField(null)} onConfirm={value => { (timeField === 'Od' ? setFrom : setTo)(value); setTimeField(null); }} />}</>;
}
function RemovalDialog({ row, date, site, busy, error, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [validation, setValidation] = useState('');
  return <Modal className="worker-editor worker-removal" title="Brisanje evidencije rada" busy={busy} onClose={onClose}
    actions={<><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button><button className="text-button remove-confirm" disabled={busy}
      onClick={() => { if (!reason.trim()) showToast('Morate uneti razlog.'); else { setValidation(''); onConfirm(reason.trim()); } }}>Potvrdi</button></>}>
    <p>Unesite razlog za brisanje evidencije rada.</p>
    <div className="worker-editor-person"><strong>Radnik: {row.worker.getFullName()}</strong><small>{dateLabel(date)} • {site?.getName()}</small></div>
    <label className="worker-reason">Razlog<textarea aria-label="Razlog" placeholder="Unesite razlog..." value={reason} onChange={event => setReason(event.target.value)} /></label>
    {validation && <p className="error-message" role="alert">{validation}</p>}
  </Modal>;
}
