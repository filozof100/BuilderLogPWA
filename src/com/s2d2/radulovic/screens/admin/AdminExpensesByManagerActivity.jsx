import { dateSortTimestamp } from '../../utils/DateSorting.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import AdminExpenseDetailsActivity from './AdminExpenseDetailsActivity.jsx';
import { Title, Icon, Notice, DateField, useLoad, monthStart, today, money } from './AdminShared.jsx';
import './AdminTasksActivity.css';
import './AdminConstructionSiteExpensesActivity.css';
import './AdminExpensesByManagerActivity.css';

function inPeriod(row, from, to) {
  const parts = /^(\d{2})\.(\d{2})\.(\d{4})\.$/.exec(row.getDate());
  if (!parts) return false;
  const key = parts[3] + '-' + parts[2] + '-' + parts[1];
  const date = new Date(key + 'T00:00:00');
  return date.getFullYear() === Number(parts[3]) && date.getMonth() + 1 === Number(parts[2]) && date.getDate() === Number(parts[1]) && key >= from && key <= to;
}
const expenseAmount = expense => Number(expense.getAmount().replace(',', '.')) || 0;
export default function AdminExpensesByManagerActivity() {
  const [manager, setManager] = useState(null);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [selected, setSelected] = useState(null);
  useBackLayer(!!selected, () => setSelected(null));
  const managers = useLoad(cb => Session.getAllManagersFromServer(cb), [], []);
  const options = useMemo(() => managers.data.map(worker => ({ worker, getName: () => worker.getFullName() })), [managers.data]);
  const advances = useLoad(cb => manager ? Session.getAdvancesForManager(manager.getId(), from, to, cb) : cb.onSuccess([]), [manager, from, to], []);
  const expenses = useLoad(cb => manager ? Session.getExpensesForManager(manager.getId(), from, to, cb) : cb.onSuccess([]), [manager, from, to], []);
  const periodAdvances = advances.loading ? [] : advances.data.filter(row => inPeriod(row, from, to));
  const periodExpenses = expenses.loading ? [] : expenses.data.filter(row => inPeriod(row, from, to));
  const charged = periodAdvances.reduce((sum, row) => sum + row.getAmount(), 0);
  const justified = periodExpenses.reduce((sum, row) => sum + expenseAmount(row), 0);
  if (selected) return <AdminExpenseDetailsActivity expense={selected} managerName={manager.getFullName()} onBack={() => setSelected(null)}/>;
  return <section className="admin-screen admin-expenses-by-manager">
    <Title title="PREGLED PO ŠEFU" subtitle="Pregled zaduženja i opravdanih troškova po šefu." icon="ic_wallet_black"/>
    <div className={'admin-task-picker' + (!manager ? ' placeholder' : '')}><SelectionDropdown label="Šef gradilišta" placeholder="Izaberite šefa gradilišta" icon="ic_site_manager_black" variant="worker" options={options} selected={options.find(option => option.worker === manager)} onSelected={option => setManager(option.worker)} emptyText={managers.loading ? 'Učitavanje...' : 'Nema dostupnih šefova gradilišta.'} maxMenuHeight={220}/></div>
    
    <div className="site-expense-period"><DateField label="Od" value={from} onChange={value => { setFrom(value); if(value > to) setTo(value); }}/><DateField label="Do" value={to} onChange={value => { setTo(value); if(value < from) setFrom(value); }}/></div>
    <div className="manager-expense-overview">
      <article className="manager-expense-charged"><div><strong>ZADUŽEN NOVAC</strong><b>{money(charged)}</b><small>RSD</small><AdvancesDropdown key={manager?.getId() + from + to} advances={periodAdvances} loading={advances.loading && !!manager}/></div><Icon name="ic_costs_wallet_blue"/></article>
      <article className="manager-expense-justified"><div><strong>OPRAVDANI TROŠKOVI</strong><b>{money(justified)}</b><small>RSD</small></div><Icon name="ic_costs_receipt_green"/></article>
    </div>
    
    <div className="manager-justified-list"><h2>OPRAVDANI TROŠKOVI</h2>
      {expenses.error ? null : !periodExpenses.length ? <Notice>{!manager ? 'Nije odabran šef gradilišta.' : expenses.loading ? 'Učitavanje troškova...' : 'Nema opravdanih troškova za izabrani period.'}</Notice> : <div className="site-expense-list">{periodExpenses.map(expense => <button type="button" className="site-manager-expense" key={expense.getId()} onClick={() => setSelected(expense)}>
        <div className="site-expense-thumbnail">{expense.getUrl() ? <AuthenticatedImage url={expense.getUrl()} alt="Račun troška"/> : <Icon name="ic_costs_gallery"/>}</div>
        <div className="site-manager-expense-copy"><strong>{expense.getTitle()}</strong><p>{expense.getDescription()}</p><span>{expense.getConstructionSiteName()?.trim() || '-'}</span><small>{expense.getDate()}</small></div><b>{money(expenseAmount(expense))} RSD</b>
      </button>)}</div>}
    </div>
  </section>;
}
function AdvancesDropdown({ advances, loading }) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const root = useRef(null);
  const popup = useRef(null);
  const trigger = useRef(null);
  useBackLayer(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const rect = root.current.getBoundingClientRect();
    setAbove(window.innerHeight - rect.bottom < 232 && rect.top > 232);
    popup.current.focus({ preventScroll: true });
    const outside = event => { if (!root.current.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const sorted = [...advances].sort((a, b) => dateSortTimestamp(b.getDate()) - dateSortTimestamp(a.getDate()));
  return <div className="manager-advances-dropdown" ref={root}>
    <button ref={trigger} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(value => !value)}>Zaduženja<Icon name={open ? 'ic_chevron_down' : 'ic_chevron_right'}/></button>
    {open && <div ref={popup} tabIndex={-1} role="dialog" aria-label="Zaduženja" className={'manager-advances-popup' + (above ? ' above' : '')} onKeyDown={event => { if(event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current.focus(); } }}>
      <header><span>Datum</span><span>Iznos</span></header>
      {loading || !sorted.length ? <p>{loading ? 'Učitavanje zaduženja...' : 'Nema zaduženja.'}</p> : <div className="manager-advances-rows">{sorted.map(advance => <div key={advance.getId()}><span>{advance.getDate()}</span><b>{money(advance.getAmount())} RSD</b></div>)}</div>}
    </div>}
  </div>;
}
