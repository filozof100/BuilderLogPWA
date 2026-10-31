import React, { useState } from 'react';
import SelectionDropdown from './SelectionDropdown.jsx';
import { DatePicker, dateLabel, dayLabel, dateValue } from './AttendancePickers.jsx';
import TimeUtils from '../../utils/TimeUtils.js';
import './StandardSiteDateControls.css';

export default function StandardSiteDateControls({ sites, site, onSiteSelected, date, onDateSelected, disabled }) {
  const [calendar, setCalendar] = useState(false);
  function shift(days) { const next = dateValue(date); next.setDate(next.getDate() + days); onDateSelected(TimeUtils.formatDate(next)); }
  return <div className="standard-site-date">
    <div className="standard-site-card manager-site-picker">
      <SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane"
        options={sites} selected={site} onSelected={onSiteSelected} optionEnabled={item => item.canSelect()} maxMenuHeight={180} disabled={disabled} />
    </div>
    <div className="standard-date-row">
      <button aria-label="Prethodni dan" disabled={disabled} onClick={() => shift(-1)}><img className="app-chevron app-chevron-left" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button>
      <button aria-label="Kalendar" disabled={disabled} onClick={() => setCalendar(true)}><img src="/assets/drawable/ic_calendar.svg" alt="" /></button>
      <div><strong>{dateLabel(date)}</strong><small>{dayLabel(date)}</small></div>
      <button aria-label="Sledeći dan" disabled={disabled} onClick={() => shift(1)}><img className="app-chevron" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button>
      <button className="standard-today" disabled={disabled} onClick={() => onDateSelected(TimeUtils.formatDate(new Date()))}><img src="/assets/drawable/ic_calendar.svg" alt="" />Danas</button>
    </div>
    {calendar && <DatePicker date={date} onClose={() => setCalendar(false)} onConfirm={value => { onDateSelected(value); setCalendar(false); }} />}
  </div>;
}
