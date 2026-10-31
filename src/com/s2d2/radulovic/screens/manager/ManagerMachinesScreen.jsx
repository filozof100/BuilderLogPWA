import LoadFailureToast from '../../LoadFailureToast.jsx';
import { withRsd } from '../../utils/MoneyDisplay.js';
import { showToast } from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import WebUtils from '../../network/WebUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import Excavator from '../../machines/Excavator.js';
import StandardSiteDateControls from '../../ui/components/StandardSiteDateControls.jsx';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { TimePicker, dateLabel, dayLabel } from '../../ui/components/AttendancePickers.jsx';
import './WorkersActivity.css';
import './DeliveryNotesActivity.css';
import './ManagerMachinesScreen.css';

const formattedAdvance = value => Number(value) ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Number(value)) : '-';
export default function ManagerMachinesScreen({ onBack }) {
  const [type, setType] = useState('excavator');
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [date, setDate] = useState(() => TimeUtils.formatDate(new Date()));
  return <MachineScreen key={type} type={type} setType={setType} site={site} setSite={setSite} date={date} setDate={setDate} onBack={onBack} />;
}
function MachineScreen({ type, setType, site, setSite, date, setDate, onBack }) {
  const truck = type === 'truck';
  const [sites, setSites] = useState([]), [workers, setWorkers] = useState([]), [rows, setRows] = useState([]), [occupied, setOccupied] = useState(new Set());
  const [log, setLog] = useState(null), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const [retry, setRetry] = useState(0), [expanded, setExpanded] = useState(null), [editor, setEditor] = useState(null), [removing, setRemoving] = useState(null);
  const lock = useRef(false);
  const [loadFailure, setLoadFailure] = useState(null);
  const machineCache = useRef([]), workerCache = useRef([]);
  useEffect(() => {
    let active = true;
    let machines = machineCache.current, options = workerCache.current, assignments = [], advances = new Map();
    let machinesLoading = true, assignmentsLoading = truck && !!site, advancesLoading = false;
    let machinesFailed = false, assignmentsFailed = false, advancesFailed = false;
    const today = TimeUtils.formatDate(new Date());
    setLog(null); setExpanded(null); setEditor(null); setRemoving(null); setError('');
    function publish() {
      if (!active) return;
      setLoadFailure(truck && (machinesFailed || assignmentsFailed) ? 'Učitavanje kamiona nije uspelo.' : advancesFailed ? 'Učitavanje akontacija nije uspelo.' : null);
      setLoading(machinesLoading || assignmentsLoading || advancesLoading);
      const machineOf = assignment => truck ? assignment.getTruck() : assignment.getExcavator();
      const workerId = assignment => truck ? assignment.getDriverId() : assignment.getOperatorId();
      setOccupied(new Set(date === today ? assignments.map(workerId) : []));
      setRows(machines.map(machine => {
        const assignment = assignments.find(item => machineOf(item).getMachineId() === machine.getMachineId() && item.getConstructionSiteId() === site?.getId());
        return { id: machine.getMachineId(), name: machine.getName(), machine, worked: !!assignment,
          logId: assignment ? (truck ? assignment.getTruckLogId() : assignment.getExcavatorLogId()) : null,
          otherSite: date === today && !assignment && assignments.some(item => machineOf(item).getMachineId() === machine.getMachineId()),
          worker: assignment ? options.find(person => person.id === workerId(assignment)) ?? null : null,
          from: TimeUtils.convertTime(assignment?.getManagerStartedAt()), to: TimeUtils.convertTime(assignment?.getManagerFinishedAt()),
          note: assignment?.getManagerNote() || '', advance: assignment ? formattedAdvance(advances.get(assignment.getMachineAssignmentId())) : '-',
        };
      }).sort((a, b) => Number(a.otherSite) - Number(b.otherSite) || Number(b.worked) - Number(a.worked) || a.name.localeCompare(b.name)));
    }
    function loadAssignments() {
      assignmentsLoading = !!site;
      if (!site) { publish(); return; }
      const callback = {
        onSuccess(value) { if (!active) return; assignments = value; assignmentsLoading = false; publish(); },
        onFailure() { if (!active) return; assignments = []; assignmentsLoading = false; assignmentsFailed = true; publish(); },
      };
      if (truck) {
        if (date === today) Session.getAllOccupiedTrucksFromServer(callback);
        else Session.getAllAssignedTrucksForDateFromServer(callback, date);
      } else if (date === today) Session.getAllOccupiedExcavatorsFromServer(callback);
      else Session.getAllAssignedExcavatorsForDateFromServer(callback, date);
    }
    publish();
    Session.getAssignedSitesFromServer({
      onSuccess(value) { if (active) setSites([...value.filter(item => item.canSelect()), ...value.filter(item => !item.canSelect())]); },
      onFailure() {},
    });
    const peopleCallback = {
      onSuccess(people) {
        if (!active) return;
        options = people.map(person => ({ id: person.getId(), getName: () => person.getFullName() }));
        workerCache.current = options; setWorkers(options); publish();
      },
      onFailure() {},
    };
    if (truck) Session.getAllDriversFromServer(peopleCallback);
    else Session.getAllOperatorsFromServer(peopleCallback);
    const machinesCallback = {
      onSuccess(value) {
        if (!active) return;
        machines = value; machineCache.current = value; machinesLoading = false;
        if (!truck) loadAssignments();
        publish();
      },
      onFailure() { if (!active) return; machinesLoading = false; machinesFailed = true; publish(); },
    };
    if (truck) {
      Session.getAllTrucksFromServer(machinesCallback);
      loadAssignments();
    } else if (site) Session.getAllOperatingExcavatorsFromServer(machinesCallback);
    else { machines = []; machinesLoading = false; publish(); }
    if (site && date <= today) DailyLogUtils.createOrUpdateDailyLog(site, date, {
      onSuccess(dailyLog) {
        if (!active) return;
        setLog(dailyLog); advancesLoading = true; publish();
        DailyLogUtils.getMachineAdvancesForDailyLog(dailyLog, truck ? 'driver' : 'operator', {
          onSuccess(value) { if (!active) return; advances = value; advancesLoading = false; publish(); },
          onFailure() { if (!active) return; advancesLoading = false; advancesFailed = true; publish(); },
        });
      },
      onFailure() {},
    });
    return () => { active = false; };
  }, [site, date, retry, truck]);
  function edit(row) { setExpanded(null); setError(''); setEditor(row); }
  function save(from, to, note, worker, advance) {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => { lock.current = false; setSaving(false); setError('Čuvanje evidencije rada nije uspelo.'); };
    const done = () => { lock.current = false; setSaving(false); setEditor(null); setRetry(value => value + 1); };
    try {
      if (editor.worked) {
        const update = truck ? DailyLogUtils.updateTruckLogManager : DailyLogUtils.updateExcavatorLogManager;
        update(log, editor.logId, editor.from, from, editor.to, to, editor.note, note, editor.advance, advance, { onSuccess: done, onFailure: fail });
      } else {
        const create = truck ? DailyLogUtils.createTruckLogManager : DailyLogUtils.createExcavatorLogManager;
        const machine = truck ? editor.machine : new Excavator(editor.machine.getMachineId(), editor.machine.getName(), editor.machine.getType(), editor.machine.getLicensePlate(), editor.machine.getStatus());
        create(log, machine, worker.id, from, to, note, advance, { onSuccess: done, onFailure: fail });
      }
    } catch { fail(); }
  }
  function remove(reason) {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => { lock.current = false; setSaving(false); setError('Brisanje evidencije rada nije uspelo.'); };
    try {
      WebUtils.sendDELETERequest((truck ? 'truck-logs/' : 'excavator-logs/') + removing.logId, JSON.stringify({ reason }), { Authorization: Session.getSessionToken() }, {
        onSuccess() { lock.current = false; setSaving(false); setRemoving(null); setRetry(value => value + 1); }, onFailure: fail,
      });
    } catch { fail(); }
  }
  return <section className="manager-machines">
    <header className="delivery-title machine-title"><span><img src={'/assets/drawable/ic_' + (truck ? 'truck' : 'excavator') + '_black.svg'} alt="" /></span><div><h1>RADNE MAŠINE</h1><p>Evidencija rada i napomena.</p></div></header>
    <div className="machine-tabs" role="tablist" aria-label="Tip mašine">{[['excavator', 'BAGERI'], ['truck', 'KAMIONI']].map(([value, label]) => <button key={value} role="tab" aria-selected={type === value} onClick={() => setType(value)}>{label}</button>)}</div>
    <StandardSiteDateControls sites={sites} site={site} onSiteSelected={setSite} date={date} onDateSelected={setDate} disabled={loading || saving} />
    
    {loadFailure ? <LoadFailureToast message={loadFailure}/> : loading || !rows.length ? <p className="delivery-notice">{loading ? 'Učitavanje mašina...' : 'Nema dostupnih mašina.'}</p> : <div className="machine-list">{rows.map(row => <article key={row.id} className={'machine-card' + (row.otherSite ? ' machine-other-site' : row.worked ? ' machine-worked' : '')}>
      <div className="machine-card-heading"><label className="machine-checkbox"><input type="checkbox" checked={row.worked} disabled={row.otherSite || !log} aria-label={(row.worked ? 'Ukloni: ' : 'Evidentiraj: ') + row.name} onChange={() => { setExpanded(null); setError(''); row.worked ? setRemoving(row) : setEditor(row); }} /></label>
        <button disabled={row.otherSite} aria-expanded={expanded === row.id} onClick={() => setExpanded(expanded === row.id ? null : row.id)}><span><strong>{row.name}</strong><small>{row.otherSite ? (truck ? 'Kamion se nalazi na drugom gradilištu' : 'Mašina se nalazi na drugom gradilištu') : row.worked ? (truck ? 'Radio danas' : 'Radila danas') : (truck ? 'Nije označen kao aktivan' : 'Nije označena kao aktivna')}</small></span><img src={'/assets/drawable/ic_chevron_' + (expanded === row.id ? 'down' : 'right') + '.svg'} alt="" /></button>
      </div>
      {expanded === row.id && <div className="machine-card-body"><WorkerPicker truck={truck} workers={workers} occupied={occupied} selected={row.worker} locked={row.worked && !!row.worker} onSelected={worker => setRows(previous => previous.map(item => item.id === row.id ? { ...item, worker } : item))} />
        <div className="machine-values">{[['Od', row.from], ['Do', row.to], ['Akontacija', row.advance]].map(([label, value]) => <label key={label}>{label}<button disabled={!log} onClick={() => edit(row)}>{label === 'Akontacija' ? withRsd(value) : value}</button></label>)}</div>
        <label className="machine-note-display">Napomena<button disabled={!log} onClick={() => edit(row)} className={!row.note ? 'empty' : ''}>{row.note || 'Dodaj napomenu'}</button></label>
      </div>}
    </article>)}</div>}
    {editor && <MachineEditor row={editor} workers={workers} occupied={occupied} truck={truck} date={date} site={site} busy={saving} error={error} onClose={() => { setEditor(null); setError(''); }} onSave={save} />}
    {removing && <MachineRemoval row={removing} truck={truck} date={date} site={site} busy={saving} error={error} onClose={() => { setRemoving(null); setError(''); }} onConfirm={remove} />}
  </section>;
}
function WorkerPicker({ truck, workers, occupied, selected, locked, onSelected, busy }) {
  const available = workers.filter(person => !occupied.has(person.id));
  return <div className="machine-worker-picker manager-site-picker"><SelectionDropdown label={truck ? 'Vozač' : 'Bagerista'} placeholder="Izaberite radnika" icon="ic_site_manager_black" options={available} selected={selected} onSelected={onSelected} disabled={busy || locked || !available.length} showChevronWhenDisabled={!locked} maxMenuHeight={180} /></div>;
}
function MachineEditor({ row, workers, occupied, truck, date, site, busy, error, onClose, onSave }) {
  const [from, setFrom] = useState(row.from), [to, setTo] = useState(row.to), [note, setNote] = useState(row.note), [advance, setAdvance] = useState(row.advance), [worker, setWorker] = useState(row.worker);
  const [timeField, setTimeField] = useState(null), [validation, setValidation] = useState('');
  function save() {
    if (!worker) { showToast('Morate odabrati radnika.'); return; }
    if (to !== '-' && to && (from === '-' || !from)) { showToast('Morate odabrati početno vreme.'); return; }
    setValidation(''); onSave(from, to, note, worker, advance || '-');
  }
  return <><Modal className="worker-editor machine-editor" title="Evidencija rada" busy={busy} onClose={onClose}
    actions={<><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button><button className="text-button confirm-button" disabled={busy} onClick={save}>{busy ? 'Čuvanje...' : 'Sačuvaj'}</button></>}>
    <div className="worker-editor-person"><strong>{row.name}</strong><small>{dateLabel(date)} {dayLabel(date)} • {site?.getName()}</small></div>
    <WorkerPicker truck={truck} workers={workers} occupied={occupied} selected={worker} locked={row.worked && !!row.worker} onSelected={setWorker} busy={busy} />
    {[['Od', from, setFrom, ['07:00', '08:00', '09:00']], ['Do', to, setTo, ['15:00', '16:00', '17:00']]].map(([label, value, change, presets]) => <div className="worker-time-section" key={label}><label>{label}</label><div><button className="worker-time-value" aria-label={label} disabled={busy} onClick={() => setTimeField(label)}>{value}</button>{presets.map(preset => <button key={preset} disabled={busy} aria-pressed={value === preset} onClick={() => change(preset)}>{preset}</button>)}</div></div>)}
    <label className="worker-advance">Akontacija<span><input aria-label="Akontacija" inputMode="numeric" value={advance} disabled={busy} onFocus={() => { if (advance === '-') setAdvance(''); }} onBlur={() => { if (!advance) setAdvance('-'); }} onChange={event => { const digits = event.target.value.replace(/\D/g, ''); setAdvance(digits ? new Intl.NumberFormat('de-DE').format(BigInt(digits)) : ''); }} /><small>RSD</small></span></label>
    <label className="worker-reason machine-editor-note">Napomena<textarea aria-label="Napomena" placeholder="Dodaj napomenu" value={note} disabled={busy} onChange={event => setNote(event.target.value)} autoCapitalize="sentences" /></label>
    {validation && <p className="error-message" role="alert">{validation}</p>}
  </Modal>{timeField && <TimePicker title={timeField} value={(timeField === 'Od' ? from : to) === '-' ? (timeField === 'Od' ? '08:00' : '16:00') : timeField === 'Od' ? from : to} onClose={() => setTimeField(null)} onConfirm={value => { (timeField === 'Od' ? setFrom : setTo)(value); setTimeField(null); }} />}</>;
}
function MachineRemoval({ row, truck, date, site, busy, error, onClose, onConfirm }) {
  const [reason, setReason] = useState(''), [validation, setValidation] = useState('');
  return <Modal className="worker-editor worker-removal machine-removal" title="Brisanje evidencije rada" busy={busy} onClose={onClose}
    actions={<><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button><button className="text-button remove-confirm" disabled={busy} onClick={() => { if (!reason.trim()) showToast('Morate uneti razlog.'); else { setValidation(''); onConfirm(reason.trim()); } }}>Potvrdi</button></>}>
    <p>Unesite razlog za brisanje evidencije rada.</p><div className="worker-editor-person"><strong>{truck ? 'Kamion' : 'Mašina'}: {row.name}</strong><small>{dateLabel(date)} • {site?.getName()}</small></div>
    <label className="worker-reason">Razlog<textarea aria-label="Razlog" placeholder="Unesite razlog..." value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>
    {validation && <p className="error-message" role="alert">{validation}</p>}
  </Modal>;
}
