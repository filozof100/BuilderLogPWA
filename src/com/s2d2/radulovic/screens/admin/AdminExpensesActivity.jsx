import React, { useState } from 'react';
import AdminAddExpenseActivity from './AdminAddExpenseActivity.jsx';
import AdminAssignAdvanceToManagerActivity from './AdminAssignAdvanceToManagerActivity.jsx';
import AdminExpensesByAdminActivity from './AdminExpensesByAdminActivity.jsx';
import AdminExpensesByManagerActivity from './AdminExpensesByManagerActivity.jsx';
import AdminConstructionSiteExpensesActivity from './AdminConstructionSiteExpensesActivity.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import { Title, Icon, DateField, monthStart, today } from './AdminShared.jsx';
import './AdminExpensesActivity.css';

const categories = [
  ['ic_construction_site_crane', 'Pregled troškova gradilišta', 'Troškovi po gradilištu'],
  ['ic_site_manager_black', 'Pregled troškova šefova gradilišta', 'Troškovi po šefu gradilišta'],
  ['ic_admin_no_background', 'Pregled troškova admina', 'Troškovi admina'],
];

export default function AdminExpensesActivity() {
  const [page, setPage] = useState(null);
  const [saving, setSaving] = useState(false);
  useBackLayer(page !== null, () => setPage(null), saving);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  if (page === 'new-expense') return <AdminAddExpenseActivity onCancel={() => setPage(null)} onBusy={setSaving}/>;
  if (page === 'assign') return <AdminAssignAdvanceToManagerActivity/>;
  if (page === 'ic_admin_no_background') return <AdminExpensesByAdminActivity/>;
  if (page === 'ic_site_manager_black') return <AdminExpensesByManagerActivity/>;
  if (page === 'ic_construction_site_crane') return <AdminConstructionSiteExpensesActivity/>;
  return <section className="admin-screen admin-expenses">
    <Title title="TROŠKOVI" subtitle="Pregled troškova, zaduženja i akontacija." icon="ic_wallet_black"/>
    <div className="admin-expenses-period">
      <h2>Period</h2>
      <div className="admin-expenses-dates">
        <DateField label="Od" value={from} onChange={value => { setFrom(value); if (value > to) setTo(value); }}/>
        <DateField label="Do" value={to} onChange={value => { setTo(value); if (value < from) setFrom(value); }}/>
      </div>
    </div>
    <div className="admin-expenses-actions">{['Zaduži šefa', 'Novi trošak'].map(label => <button type="button" key={label} onClick={() => setPage(label === 'Zaduži šefa' ? 'assign' : 'new-expense')}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>{label}
    </button>)}</div>
    {categories.map(([icon, title, subtitle]) => <button type="button" className="admin-expenses-category" key={title} onClick={() => setPage(icon)}>
      <span className="admin-expenses-category-icon"><Icon name={icon}/></span>
      <span className="admin-expenses-category-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      <Icon name="ic_chevron_right" className="admin-expenses-chevron"/>
    </button>)}
  </section>;
}
