import { showToast } from './Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import TruckLog from '../../attendances/TruckLog.js';
import Modal from './Modal.jsx';
import SettingsAccessBar from './SettingsAccessBar.jsx';
import DriverTasksCard from './DriverTasksCard.jsx';

const normalize = value => value.trim() === '-' ? null : value.trim() || null;
function sanitizeHours(value) {
  let dot = false;
  return [...value].filter(char => {
    if (/\d/.test(char)) return true;
    if ((char === '.' || char === ',') && !dot) { dot = true; return true; }
    return false;
  }).join('').replace(',', '.').slice(0, 8);
}
function changedValue(body, key, previous, next) {
  if (normalize(previous) !== normalize(next)) body[key] = normalize(next);
}

export default function DriverWorkScreen({ truck = false, assignment, onSettings }) {
  const [log, setLog] = useState({ id: assignment.logId, machine: assignment.machine.getName(), site: assignment.siteName,
    start: '-', end: '-', first: '', last: '', note: '', litres: '', level: '-' });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [dialog, setDialog] = useState(null);
  const [expanded, setExpanded] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoaded(false); setError('');
    const loadFailed = () => { if (active) { setError('retry'); showToast('Neuspešno učitavanje evidencije rada'); } };
    const callback = {
      onSuccess(value) {
        if (!active) return;
        if (!value) { loadFailed(); return; }
        setLog({
          id: truck ? value.getTruckLogId() : value.getExcavatorLogId(),
          machine: (truck ? value.getTruck() : value.getExcavator()).getName(),
          site: truck ? assignment.siteName : value.getConstructionSiteName(),
          start: TimeUtils.convertTime(truck ? value.getDriverStartedAt() : value.getOperatorStartedAt()),
          end: TimeUtils.convertTime(truck ? value.getDriverFinishedAt() : value.getOperatorFinishedAt()),
          first: String((truck ? value.getStartKm() : value.getStartHours()) ?? ''),
          last: String((truck ? value.getEndKm() : value.getEndHours()) ?? ''),
          note: (truck ? value.getDriverNote() : value.getOperatorNote()) ?? '',
          litres: truck ? String(value.getFuelAdded() ?? '') : '',
          level: truck ? value.getFuelRemainingDisplayValue() : '-',
        });
        setLoaded(true); setError('');
      },
      onFailure: loadFailed,
    };
    if (truck) Session.getAssignedTruck(callback); else Session.getAssignedExcavator(callback);
    return () => { active = false; };
  }, [truck, assignment, reload]);

  function save(body, changes, failure) {
    if (saving.current) return;
    if (log.id <= 0) { showToast(truck ? 'Nedostaje ID evidencije vožnje' : 'Nedostaje ID evidencije rada'); return; }
    if (!Object.keys(body).length) { setLog(previous => ({ ...previous, ...changes })); setDialog(null); return; }
    saving.current = true; setBusy(true); setError('');
    const fail = () => { saving.current = false; setBusy(false); showToast(failure); };
    try {
      WebUtils.sendPATCHRequest((truck ? 'truck-logs/' : 'excavator-logs/') + log.id, JSON.stringify(body),
        { Authorization: Session.getSessionToken() }, {
          onSuccess() { saving.current = false; setBusy(false); setLog(previous => ({ ...previous, ...changes })); setDialog(null); },
          onFailure: fail,
        });
    } catch { fail(); }
  }
  function saveDay() {
    const starting = dialog === 'start';
    setDialog(null);
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    save({ [starting ? 'operator_started_at' : 'operator_finished_at']: Session.getSessionDateString() + ' ' + time,
      [starting ? 'started' : 'finished']: true }, { [starting ? 'start' : 'end']: time }, 'Neuspešno čuvanje vremena');
  }
  function saveWork(draft) {
    const body = {};
    if (log.end !== '-' && log.end && (!log.start || log.start === '-')) { showToast('Morate odabrati početno vreme.'); return; }
    if (truck && log.start !== '-' && log.end !== '-' && log.start >= log.end) {
      showToast('Vreme početka rada mora biti manje od vremena kraja rada.'); return;
    }
    if (truck && draft.first && draft.last && Number(draft.first) >= Number(draft.last)) {
      showToast('Početna kilometraža mora biti manja od krajnje kilometraže.'); return;
    }
    if (!truck && draft.last && !draft.first) { showToast('Morate uneti radne sate na početku dana.'); return; }
    const first = draft.first ? Number(draft.first) : NaN;
    const last = draft.last ? Number(draft.last) : NaN;
    if (!truck && last < first) { showToast('Radni sati na kraju ne mogu biti manji od početnih.'); return; }
    changedValue(body, truck ? 'start_mileage' : 'start_work_hours', log.first, draft.first);
    changedValue(body, truck ? 'end_mileage' : 'finish_work_hours', log.last, draft.last);
    changedValue(body, truck ? 'note' : 'note_operator', log.note, draft.note.trim());
    if (!truck && !Number.isNaN(first) && !Number.isNaN(last)) body.work_hours = last - first;
    save(body, { ...draft, note: draft.note.trim() }, truck ? 'Neuspešno čuvanje evidencije vožnje' : 'Neuspešno čuvanje evidencije rada');
  }
  function saveFuel(draft) {
    const body = {};
    if (draft.level !== log.level && draft.level !== '-') body.fuel_remaining = TruckLog.getFuelRemainingRequestValue(draft.level);
    if (draft.litres !== log.litres) body.fuel_added = draft.litres ? Number(draft.litres) : null;
    save(body, draft, 'Neuspešno čuvanje podataka o gorivu');
  }
  function open(name) { setExpanded(''); setError(''); setDialog(name); }
  const firstLabel = truck ? 'Km početak' : 'Radni sati na početku';
  const lastLabel = truck ? 'Km kraj' : 'Radni sati na kraju';
  const close = () => { setDialog(null); setError(''); };
  const dayAction = dialog === 'start' ? 'Započni dan' : 'Završi dan';
  return <section className="driver-work-screen" onClick={event => { if (event.target === event.currentTarget) setExpanded(''); }}>
    <header className="driver-title">
      <span className={'driver-avatar' + (truck ? ' truck-avatar' : '')}><Icon name={truck ? 'ic_truck_driver_black' : 'ic_excavator_driver'} /></span>
      <div><h1>{Session.getCurrentUser().getFullName()}</h1>
        <p>{truck ? 'Evidencija vožnje, kilometraže, goriva i napomena.' : 'Evidencija rada mašine, radnih sati i napomena.'}</p></div>
      <SettingsAccessBar onOpen={onSettings} />
    </header>
    
    <section className="work-card assignment-card">
      {truck ? <Field label="Izabran kamion" value={log.machine} /> : <>
        <button className="card-heading" onClick={() => setExpanded(expanded === 'assignment' ? '' : 'assignment')} aria-expanded={expanded === 'assignment'}>
          Detalji rada za danas<Icon name={expanded === 'assignment' ? 'ic_chevron_down' : 'ic_chevron_right'} /></button>
        {expanded === 'assignment' && <><Field label="Dodeljena mašina" value={log.machine} /><Field label="Dodeljeno gradilište" value={log.site} /></>}
      </>}
    </section>
    <DriverTasksCard expanded={expanded === 'tasks'} onExpandedChange={value => setExpanded(value ? 'tasks' : '')} />
    <section className="work-card">
      <div className="work-row"><Field label="Vreme početka" value={log.start} icon="ic_clock" />
        <Field label={firstLabel} value={log.first} suffix={truck ? 'km' : 'h'} icon="ic_km_meter" onClick={() => open('work')} disabled={!loaded} /></div>
      <div className="work-row"><Field label="Vreme kraj" value={log.end} icon="ic_clock" />
        <Field label={lastLabel} value={log.last} suffix={truck ? 'km' : 'h'} icon="ic_km_meter" onClick={() => open('work')} disabled={!loaded} /></div>
      <div className="work-row">
        <button className="day-button" disabled={!loaded || busy || log.start !== '-'} onClick={() => open('start')}><Icon name="ic_clock" />Započni dan</button>
        <button className="day-button" disabled={!loaded || busy || log.start === '-' || log.end !== '-'} onClick={() => open('end')}><Icon name="ic_clock" />Završi dan</button>
      </div>
    </section>
    {truck && <section className="work-card">
      <Field label="Sipano gorivo" value={log.litres ? log.litres + ' l' : '-'} icon="ic_gas_station" onClick={() => open('fuel')} disabled={!loaded} chevron />
      <Field label="Rezervoar na kraju dana" value={log.level} icon="ic_gas_station" onClick={() => open('fuel')} disabled={!loaded} chevron />
    </section>}
    <section className="work-card"><span className="work-label">Napomena</span>
      <button className="work-note" onClick={() => open('work')} disabled={!loaded}>
        <span className={log.note ? '' : 'muted'}>{log.note || 'Upiši napomenu...'}</span><small>{log.note.length}/500</small>
      </button>
    </section>
    {(dialog === 'start' || dialog === 'end') && <Modal className="day-confirmation" title={dayAction} onClose={close} busy={busy}
      actions={<Actions busy={busy} onClose={close} onSave={saveDay} label={dayAction} />}>
      <p>Da li ste sigurni da želite da {dialog === 'start' ? 'započnete' : 'završite'} dan? <strong>Nakon potvrde neće biti moguće menjati {dialog === 'start' ? 'početno' : 'krajnje'} vreme.</strong></p>
      {error && <p role="alert" className="error-message">{error}</p>}
    </Modal>}
    {dialog === 'work' && <WorkEditor truck={truck} log={log} busy={busy} error={error} onClose={close} onSave={saveWork} firstLabel={firstLabel} lastLabel={lastLabel} />}
    {dialog === 'fuel' && <FuelEditor log={log} busy={busy} error={error} onClose={close} onSave={saveFuel} />}
  </section>;
}
function Icon({ name }) { return <img className="work-icon" src={'/assets/drawable/' + name + '.svg'} alt="" />; }
function Field({ label, value, icon, suffix, onClick, disabled, chevron }) {
  const content = <>{icon && <Icon name={icon} />}<strong>{value || '-'}</strong>{suffix && <small>{suffix}</small>}{chevron && <Icon name="ic_chevron_down" />}</>;
  return <div className="work-field"><span className="work-label">{label}</span>
    {onClick ? <button className="work-value" aria-label={label} onClick={onClick} disabled={disabled}>{content}</button> : <div className="work-value">{content}</div>}</div>;
}
function Actions({ busy, onClose, onSave, label = 'OK' }) {
  return <><button className="text-button" disabled={busy} onClick={onClose}>Otkaži</button>
    <button className="text-button confirm-button" disabled={busy} onClick={onSave}>{busy ? 'Čuvanje...' : label}</button></>;
}
function NumberField({ label, value, onChange, truck, suffix }) {
  return <label className="work-field"><span className="work-label">{label}</span><span className="work-input">
    <input aria-label={label} placeholder="-" inputMode={truck ? 'numeric' : 'decimal'} value={value} onChange={event => onChange(event.target.value)} /><small>{suffix}</small>
  </span></label>;
}
function WorkEditor({ truck, log, busy, error, onClose, onSave, firstLabel, lastLabel }) {
  const [draft, setDraft] = useState({ first: normalize(log.first) ?? '', last: normalize(log.last) ?? '', note: log.note });
  function number(key, value) { setDraft(previous => ({ ...previous, [key]: truck ? value.replace(/\D/g, '').slice(0, 7) : sanitizeHours(value) })); }
  return <Modal className="work-editor" title={truck ? 'Evidencija vožnje' : 'Evidencija rada'} busy={busy} onClose={onClose}
    actions={<Actions busy={busy} onClose={onClose} onSave={() => onSave(draft)} />}>
    <div className="work-row editor-times"><Field label="Od" value={log.start} /><Field label="Do" value={log.end} /></div>
    <div className="work-row">
      <NumberField label={firstLabel} value={draft.first} onChange={value => number('first', value)} truck={truck} suffix={truck ? 'km' : 'h'} />
      <NumberField label={lastLabel} value={draft.last} onChange={value => number('last', value)} truck={truck} suffix={truck ? 'km' : 'h'} />
    </div>
    <label className="work-field"><span className="work-label">Napomena</span><span className="note-editor">
      <textarea aria-label="Napomena" placeholder="Upiši napomenu..." maxLength={500} value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} />
      <small>{draft.note.length}/500</small></span></label>
    {error && <p role="alert" className="error-message">{error}</p>}
  </Modal>;
}
function FuelEditor({ log, busy, error, onClose, onSave }) {
  const [draft, setDraft] = useState({ litres: log.litres, level: log.level });
  return <Modal className="fuel-editor" title="Gorivo" busy={busy} onClose={onClose}
    actions={<Actions busy={busy} onClose={onClose} onSave={() => onSave(draft)} />}>
    <NumberField label="Sipano gorivo" value={draft.litres} truck suffix="l" onChange={value => setDraft({ ...draft, litres: value.replace(/\D/g, '').slice(0, 5) })} />
    <span className="work-label">Rezervoar na kraju dana</span>
    <div className="fuel-levels">{['Pun', '1/2', '1/4', '1/8'].map(level => <button key={level} aria-pressed={draft.level === level}
      onClick={() => setDraft({ ...draft, level })}>{level}</button>)}</div>
    {error && <p role="alert" className="error-message">{error}</p>}
  </Modal>;
}
