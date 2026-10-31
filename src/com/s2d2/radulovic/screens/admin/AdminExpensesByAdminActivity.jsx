import LoadFailureToast from '../../LoadFailureToast.jsx';
import React, { useState } from 'react';
import Session from '../../network/Session.js';
import useBackLayer from '../../ui/components/useBackLayer.js';
import AdminExpenseDetailsActivity from './AdminExpenseDetailsActivity.jsx';
import { Title, Notice, DateField, useLoad, monthStart, today } from './AdminShared.jsx';
import './AdminExpensesActivity.css';
import './AdminExpensesByAdminActivity.css';

// Keep decimal totals exact and use Java NumberFormat's half-even integer rounding.
function wholeDinars(values) {
  const decimals = values.map(value => {
    const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(String(value));
    if (!match || !(match[2] || match[3])) return [0n, 0];
    const scale = (match[3] || '').length - Number(match[4] || 0);
    const digits = BigInt((match[1] === '-' ? '-' : '') + (match[2] || '0') + (match[3] || ''));
    return scale < 0 ? [digits * 10n ** BigInt(-scale), 0] : [digits, scale];
  });
  const scale = Math.max(0, ...decimals.map(([, places]) => places));
  const divisor = 10n ** BigInt(scale);
  const total = decimals.reduce((sum, [digits, places]) => sum + digits * 10n ** BigInt(scale - places), 0n);
  const absolute = total < 0n ? -total : total;
  let rounded = absolute / divisor;
  const remainder = absolute % divisor;
  if (remainder * 2n > divisor || (remainder * 2n === divisor && rounded % 2n !== 0n)) rounded++;
  return new Intl.NumberFormat('sr-RS').format(total < 0n ? -rounded : rounded);
}
function sortDate(expense) {
  const parts = /^(\d{2})\.(\d{2})\.(\d{4})\.$/.exec(expense.getDate());
  if (!parts) return -Infinity;
  const date = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
  return date.getMonth() + 1 === Number(parts[2]) && date.getDate() === Number(parts[1]) ? date.getTime() : -Infinity;
}
export default function AdminExpensesByAdminActivity() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [selected, setSelected] = useState(null);
  useBackLayer(!!selected, () => setSelected(null));
  const expenses = useLoad(cb => Session.getAdminExpensesFromServer(from, to, cb), [from, to], []);
  const rows = expenses.loading || expenses.error ? [] : [...expenses.data].sort((a, b) => sortDate(b) - sortDate(a));
  if (selected) return <AdminExpenseDetailsActivity expense={selected} admin onBack={() => setSelected(null)}/>;
  return <section className="admin-screen admin-expenses-by-admin">
    <Title title="TROŠKOVI ADMINA" icon="ic_admin_no_background"/>
    <div className="admin-expenses-period"><h2>Period</h2><div className="admin-expenses-dates">
      <DateField label="Od" value={from} onChange={value => { setFrom(value); if (value > to) setTo(value); }}/>
      <DateField label="Do" value={to} onChange={value => { setTo(value); if (value < from) setFrom(value); }}/>
    </div></div>
    <div className="admin-expenses-total"><div><strong>UKUPNI TROŠKOVI</strong><b>{expenses.loading || expenses.error ? '-' : wholeDinars(rows.map(expense => expense.getAmount())) + ' RSD'}</b></div><i aria-hidden="true"/></div>
    {expenses.loading ? <Notice>Učitavanje troškova...</Notice> : expenses.error ? <LoadFailureToast message="Učitavanje troškova nije uspelo."/> : !rows.length ? <Notice>Nema troškova admina za izabrani period.</Notice> : rows.map(expense => <button type="button" className="admin-own-expense" key={expense.getId()} onClick={() => setSelected(expense)}>
      <div><strong>{expense.getTitle()}</strong><b>{wholeDinars([expense.getAmount()])} RSD</b></div>
      <p>{expense.getDescription()}</p><small>{expense.getDate()}</small><span>{expense.getConstructionSiteName()}</span>
    </button>)}
  </section>;
}
