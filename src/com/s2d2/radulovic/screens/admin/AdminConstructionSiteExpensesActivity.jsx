import LoadFailureToast from '../../LoadFailureToast.jsx';
import { withRsd } from '../../utils/MoneyDisplay.js';
import React, { useState } from 'react';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import AdminWorkerDetailsActivity from './AdminWorkerDetailsActivity.jsx';
import AdminExpenseDetailsActivity from './AdminExpenseDetailsActivity.jsx';
import { Title, Icon, Notice, DateField, useLoad, monthStart, today, money } from './AdminShared.jsx';
import './AdminDeliveryNotesActivity.css';
import './AdminConstructionSiteExpensesActivity.css';

const allSites = { isAllSites: true, getName: () => 'Sva gradilišta', getId: () => -1, canSelect: () => true };
const amount = value => Number(String(value).replace(',', '.')) || 0;
export default function AdminConstructionSiteExpensesActivity({ onBack, initialSite, initialFrom, initialTo, lockSite = false } = {}) {
  const [site, setSite] = useState(initialSite ?? null);
  const [from, setFrom] = useState(() => initialFrom ?? monthStart());
  const [to, setTo] = useState(() => initialTo ?? today());
  const [tab, setTab] = useState(0);
  const [detail, setDetail] = useState(null);
  useBackLayer(!!detail, () => setDetail(null));
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const all = site === allSites;
  const expenses = useLoad(cb => {
    if (!site || all) { cb.onSuccess([[], []]); return; }
    Session.getExpensesForConstructionSite(site.getId(), from, to, { onSuccess(admin, manager) { cb.onSuccess([admin, manager]); }, onFailure: cb.onFailure });
  }, [site, from, to], [[], []]);
  const salaries = useLoad(cb => !site || all ? cb.onSuccess([]) : Session.getWorkerSalariesFromServer(from, to, site.getId(), cb), [site, from, to], []);
  const summaries = useLoad(cb => !all ? cb.onSuccess(new Map()) : Session.getExpensesForAllSitesSite(from, to, cb), [all, from, to], new Map());
  const [admins, managers] = expenses.loading ? [[], []] : expenses.data;
  const wages = salaries.loading ? [] : salaries.data;
  const overviews = summaries.loading ? [] : [...summaries.data].map(([key, value]) => ({ id: key.first, name: key.second, amounts: [amount(value.getWorkerSalaries()), amount(value.getManagerExpenses()), amount(value.getAdminExpenses())] }))
    .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()) || a.id - b.id);
  const totals = all ? overviews.reduce((sum, row) => sum.map((value, i) => value + row.amounts[i]), [0, 0, 0])
    : [wages.reduce((sum, row) => sum + row.getAmount(), 0), managers.reduce((sum, row) => sum + amount(row.getAmount()), 0), admins.reduce((sum, row) => sum + amount(row.getAmount()), 0)];
  const cards = [ ['PLATE\nRADNIKA', 'ic_workers_black_no_bg_original_proportions', 30], ['TROŠKOVI\nŠEFOVA', 'ic_costs_wallet_blue', 20], ['TROŠKOVI\nADMINA', 'ic_admin_no_background', 30], [all ? 'UKUPNO' : 'UKUPNO ZA\nGRADILIŠTE', 'ic_construction_site_crane', 34] ];
  if (detail?.expense) return <AdminExpenseDetailsActivity expense={detail.expense} admin={detail.admin} onBack={() => setDetail(null)}/>;
  if (detail?.workerId) return <SalaryDetails workerId={detail.workerId} from={from} to={to} onBack={() => setDetail(null)}/>;
  return <section className="admin-screen admin-site-expenses">
    <Title title="PREGLED PO GRADILIŠTU" subtitle="Plate radnika, troškovi šefova i admina za izabrano gradilište." icon="ic_wallet_black"/>
    <div className={'admin-delivery-sites' + (!site ? ' placeholder' : '')}><SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={[allSites, ...[...sites.data].sort((a,b) => Number(b.canSelect()) - Number(a.canSelect()))]} selected={site} disabled={lockSite} onSelected={setSite} optionEnabled={s => s.canSelect()}/></div>
    
    <div className="site-expense-period"><DateField label="Od" value={from} onChange={value => { setFrom(value); if(value > to) setTo(value); }}/><DateField label="Do" value={to} onChange={value => { setTo(value); if(value < from) setFrom(value); }}/></div>
    <div className="site-expense-summary">{cards.map(([label, icon, size], i) => <article className={'site-expense-tone tone-' + i} key={i}><div><strong>{label}</strong><i style={{ width:size, height:size, maskImage:`url(/assets/drawable/${icon}.svg)` }}/></div><footer><b>{money(i === 3 ? totals.reduce((sum, value) => sum + value, 0) : totals[i])}</b><small>RSD</small></footer></article>)}</div>
    {all ? summaries.loading ? <Notice>Učitavanje troškova...</Notice> : summaries.error ? <LoadFailureToast message="Učitavanje troškova nije uspelo."/> : !overviews.length ? <Notice>Nema troškova za izabrani period.</Notice> : overviews.map(row => <article className="site-expense-overview" key={row.id}><strong>{row.name}</strong><div>{['Plate radnika','Troškovi šefova','Troškovi admina'].map((label,i) => <div key={label}><small>{label}</small><b className={'tone-'+i}>{withRsd(money(row.amounts[i]))}</b></div>)}</div><footer><span>Ukupno</span><b>{money(row.amounts.reduce((sum, value) => sum + value, 0))} RSD</b></footer></article>) : <>
      <div className="site-expense-tabs" role="tablist" aria-label="Troškovi">{['Plate\nradnika','Troškovi\nšefova','Troškovi\nadmina'].map((label, i) => <button type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} key={i}>{label}</button>)}</div>
      {tab === 0 ? !site || salaries.loading || salaries.error || !wages.length ? <>{salaries.error ? <LoadFailureToast message="Učitavanje plata radnika nije uspelo."/> : <Notice><span className="site-salary-notice">{!site ? 'Nije odabrano gradilište.' : salaries.loading ? 'Učitavanje plata radnika...' : salaries.error ? 'Učitavanje plata radnika nije uspelo.' : 'Nema plata radnika za izabrani period.'}</span></Notice>}</> : <div className="site-salary-table"><header><span>Ime</span><span>Prezime</span><span>Plata</span></header>{wages.map(row => <button type="button" key={row.getWorker().getId()} onClick={() => setDetail({workerId:row.getWorker().getId()})}><span>{row.getWorker().getFirstName()}</span><span>{row.getWorker().getLastName()}</span><strong>{money(row.getAmount())} RSD</strong></button>)}</div>
      : expenses.error ? <LoadFailureToast message="Učitavanje troškova nije uspelo."/> : !site || expenses.loading || !(tab === 1 ? managers : admins).length ? <Notice><span className={tab === 1 ? 'site-manager-notice' : ''}>{!site ? 'Nije odabrano gradilište.' : expenses.loading ? 'Učitavanje troškova...' : tab === 1 ? 'Nema troškova šefova za izabrani period.' : 'Nema troškova admina za izabrani period.'}</span></Notice> : <div className="site-expense-list">{(tab === 1 ? managers : admins).map(expense => tab === 1 ? <button type="button" className="site-manager-expense" key={expense.getId()} onClick={() => setDetail({expense})}>
        <div className="site-expense-thumbnail">{expense.getUrl() ? <AuthenticatedImage url={expense.getUrl()} alt="Račun troška"/> : <Icon name="ic_costs_gallery"/>}</div>
        <div className="site-manager-expense-copy"><strong>{expense.getTitle()}</strong><p>{expense.getDescription()}</p><span><Icon name="ic_manager"/>{expense.getManager()?.getFullName() || '-'}</span><small>{expense.getDate()}</small></div><b>{money(amount(expense.getAmount()))} RSD</b>
      </button> : <button type="button" className="site-admin-expense" key={expense.getId()} onClick={() => setDetail({expense, admin:true})}><div><strong>{expense.getTitle()}</strong><b>{money(amount(expense.getAmount()))} RSD</b></div><small>{expense.getDate()}</small><p>{expense.getDescription()}</p></button>)}</div>}
    </>}
  </section>;
}
function SalaryDetails({ workerId, from, to, onBack }) {
  const worker = useLoad(cb => Session.getWorkerDetailsAdmin(workerId, cb), [workerId]);
  if (!worker.data) return <section className="admin-screen"><>{worker.error ? <LoadFailureToast message="Učitavanje podataka radnika nije uspelo."/> : <Notice>{worker.error ? 'Učitavanje podataka radnika nije uspelo.' : 'Učitavanje podataka radnika...'}</Notice>}</></section>;
  return <AdminWorkerDetailsActivity worker={worker.data} initialFrom={from} initialTo={to} onBack={onBack}/>;
}
