import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import './AttendancePickers.css';
import TimeUtils from '../../utils/TimeUtils.js';

export function dateValue(value) { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12); }
export function dateLabel(value) { const [y, m, d] = value.split('-'); return d + '.' + m + '.' + y + '.'; }
export function dayLabel(value) { return ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'][dateValue(value).getDay()]; }

export function DatePicker({ date, onClose, onConfirm }) {
  const [selected, setSelected] = useState(date);
  const [month, setMonth] = useState(() => { const d = dateValue(date); d.setDate(1); return d; });
  const touch = useRef(null);
  function move(delta) { setMonth(previous => new Date(previous.getFullYear(), previous.getMonth() + delta, 1, 12)); }
  const start = new Date(month); start.setDate(1 - (month.getDay() + 6) % 7);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const title = month.toLocaleDateString('sr-RS', { month: 'long' }) + ' ' + month.getFullYear();
  return <Modal className="attendance-calendar" title={<><button aria-label="Prethodni mesec" onClick={() => move(-1)}><img className="app-chevron app-chevron-left" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button><span>{title}</span><button aria-label="Sledeći mesec" onClick={() => move(1)}><img className="app-chevron" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button></>} onClose={onClose}
    actions={<><button className="text-button" onClick={onClose}>Otkaži</button><button className="text-button confirm-button" onClick={() => { onConfirm(selected); onClose(); }}>OK</button></>}>
    <div className="attendance-calendar-grid" onTouchStart={event => { touch.current = event.touches[0].clientX; }}
      onTouchEnd={event => { const delta = event.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 80) move(delta < 0 ? 1 : -1); }}>
      {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((label, i) => <small key={i}>{label}</small>)}
      {cells.map(d => { const value = TimeUtils.formatDate(d); return <button key={value} aria-label={dateLabel(value)} aria-pressed={selected === value}
        className={(d.getMonth() !== month.getMonth() ? 'outside-month ' : '') + (value === TimeUtils.formatDate(new Date()) ? 'calendar-today' : '')} onClick={() => setSelected(value)}>{d.getDate()}</button>; })}
    </div>
  </Modal>;
}
export function TimePicker({ title, value, onClose, onConfirm }) {
  const [hour, setHour] = useState(Number(value.split(':')[0]));
  const [minute, setMinute] = useState(Number(value.split(':')[1]));
  return <Modal className="attendance-time-picker" title={'Izaberite vreme - ' + title} onClose={onClose}
    actions={<><button className="text-button" onClick={onClose}>Otkaži</button><button className="text-button confirm-button"
      onClick={() => onConfirm(String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'))}>OK</button></>}>
    <div className="attendance-time-wheels"><TimeWheel label="Sati" count={24} value={hour} onChange={setHour} /><b>:</b><TimeWheel label="Minuti" count={60} value={minute} onChange={setMinute} cyclic /></div>
  </Modal>;
}
function TimeWheel({ label, count, value, onChange, cyclic = false }) {
  const ref = useRef(null);
  const initial = useRef(value);
  const total = cyclic ? count * 3 : count;
  useEffect(() => {
    const frame = requestAnimationFrame(() => { ref.current.scrollTop = (initial.current + (cyclic ? count : 0)) * 60; });
    return () => cancelAnimationFrame(frame);
  }, [count, cyclic]);
  return <div ref={ref} className="attendance-time-wheel" role="spinbutton" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={count - 1} tabIndex={0}
    onScroll={event => {
      const element = event.currentTarget;
      const index = Math.round(element.scrollTop / 60);
      onChange(index % count);
      if (cyclic && (index < count / 2 || index >= count * 2.5)) element.scrollTop = (index % count + count) * 60;
    }}
    onKeyDown={event => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : cyclic ? (value + (event.key === 'ArrowUp' ? -1 : 1) + count) % count : Math.max(0, Math.min(count - 1, value + (event.key === 'ArrowUp' ? -1 : 1)));
      ref.current.scrollTop = (next + (cyclic ? count : 0)) * 60;
    }}>
    {Array.from({ length: total }, (_, index) => <div aria-hidden="true" key={index} onClick={() => { ref.current.scrollTop = index * 60; onChange(index % count); }}>{String(index % count).padStart(2, '0')}</div>)}
  </div>;
}
