import AdminAddConstructionSiteActivity from './AdminAddConstructionSiteActivity.jsx';
import AdminEditConstructionSiteActivity from './AdminEditConstructionSiteActivity.jsx';
import AdminWorkHistoryActivity from './AdminWorkHistoryActivity.jsx';
import AdminDocumentsActivity from './AdminDocumentsActivity.jsx';
import AdminDeliveryNotesActivity from './AdminDeliveryNotesActivity.jsx';
import AdminNotesActivity from './AdminNotesActivity.jsx';
import AdminConstructionSiteExpensesActivity from './AdminConstructionSiteExpensesActivity.jsx';
import AdminConstructionSiteTasksActivity from './AdminConstructionSiteTasksActivity.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useRef, useState } from 'react';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import { Title, Icon, MaterialIcon, DateRange, Notice, useLoad, mutate, monthStart, today } from './AdminShared.jsx';
import './AdminConstructionSiteDetailsActivity.css';

const actions = [
  ['EVIDENCIJA RADA', 'clock'], ['DOKUMENTI', 'ic_folder_simple_black'],
  ['OTPREMNICE', 'ic_document_lines_black'], ['GRAĐEVINSKI DNEVNIK', 'ic_diary'],
  ['TROŠKOVI', 'ic_wallet_black'], ['ZADACI', 'ic_tasks_black'],
];
function ManagementIcon({ name }) {
  if (name === 'edit') return <MaterialIcon name="edit" size={18}/>;
  const paths = {
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
    close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2ZM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6Zm9 14H6V10h12v10Zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z',
    unlock: 'M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Zm6-9H9V6c0-1.66 1.34-3 3-3s3 1.34 3 3h2c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2Zm0 12H6V10h12v10Z',
  };
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d={paths[name]}/></svg>;
}
function ManagementButton({ icon, children, className = '', ...props }) {
  return <button type="button" className={'site-management-button ' + className} {...props}><ManagementIcon name={icon}/>{children}</button>;
}
export default function AdminConstructionSiteDetailsActivity() {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [siteVersion, setSiteVersion] = useState(0);
  const [section, setSection] = useState(null);
  useBackLayer(section !== null, () => setSection(null));
  const [confirmation, setConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const sites = useLoad(cb => Session.getAllSitesFromServer({
    onSuccess(rows) { setSite(current => rows.find(row => row.getId() === current?.getId()) ?? null); cb.onSuccess(rows); },
    onFailure: cb.onFailure,
  }), [siteVersion], []);
  const costs = useLoad(cb => {
    if (!site) { cb.onSuccess(null); return; }
    Session.getExpensesForAllSitesSite(from, to, {
      onSuccess(rows) {
        const summary = [...rows].find(([key]) => key.first === site.getId())?.[1];
        cb.onSuccess(summary ? [summary.getWorkerSalaries(), summary.getManagerExpenses(), summary.getAdminExpenses()]
          .reduce((total, amount) => total + Math.trunc(Number(amount)), 0) : 0);
      }, onFailure: cb.onFailure,
    });
  }, [site?.getId(), from, to, siteVersion]);
  const active = site?.isActive() ?? true;
  function updateStatus() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    mutate('PATCH', 'construction-sites/' + site.getId(), {
      name: site.getName(), site_manager_ids: (site.getAssignedManagers() ?? []).map(manager => manager.getId()), status: active ? 'paused' : 'active',
    }, {
      onSuccess() { site.setActive(!active); lock.current = false; setBusy(false); setConfirmation(false); },
      onFailure() { lock.current = false; setBusy(false); showToast('Ažuriranje podataka nije uspelo'); },
    });
  }
  function sectionAction(index) {
    if (!site) { showToast('Morate odabrati gradilište'); return; }
    setSection(index);
  }
  if (adding) return <AdminAddConstructionSiteActivity onBack={() => setAdding(false)} onSaved={() => setSiteVersion(value => value + 1)}/>;
  if (editing) return <AdminEditConstructionSiteActivity constructionSite={site} onBack={() => setEditing(false)} onSaved={() => { setEditing(false); setSiteVersion(value => value + 1); }} onDeleted={() => { setEditing(false); setSite(null); setSiteVersion(value => value + 1); }}/>;
  const childProps = { initialSite: site, initialFrom: from, initialTo: to, lockSite: true, onBack: () => setSection(null) };
  if (section === 0) return <AdminWorkHistoryActivity {...childProps}/>;
  if (section === 1) return <AdminDocumentsActivity {...childProps}/>;
  if (section === 2) return <AdminDeliveryNotesActivity {...childProps}/>;
  if (section === 3) return <AdminNotesActivity {...childProps}/>;
  if (section === 4) return <AdminConstructionSiteExpensesActivity {...childProps}/>;
  if (section === 5) return <AdminConstructionSiteTasksActivity constructionSite={site}/>;
  return <section className="admin-screen admin-construction-sites">
    <Title title="GRADILIŠTA" subtitle="Pregled ključnih podataka i sekcija za izabrano gradilište." icon="ic_construction_site_crane"/>
    <div className="construction-site-picker"><SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={sites.data} selected={site} onSelected={setSite} maxMenuHeight={180} emptyText=" "/></div>
    <DateRange from={from} to={to} onChange={(start, end) => { setFrom(start); setTo(end); }}/>
    {site && <button type="button" className="construction-site-costs" onClick={() => sectionAction(4)}><i/><span><small>Ukupni troškovi</small><strong>{costs.loading || costs.data == null ? '-' : new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 }).format(costs.data) + ' RSD'}</strong></span><Icon name="ic_chevron_right"/></button>}
    <div className="construction-site-management">
      <ManagementButton icon="add" className="site-add" onClick={() => setAdding(true)}>Dodaj novo gradilište</ManagementButton>
      {!site ? <Notice>Nije odabrano gradilište.</Notice> : <>
        <div className={'construction-site-identity ' + (active ? 'active' : 'inactive')}><strong>{site.getName()}</strong><span><i/>{active ? 'Aktivno' : 'Neaktivno'}</span></div>
        <div className="construction-site-controls"><ManagementButton icon="edit" className="site-edit" onClick={() => setEditing(true)}>Izmeni trenutno gradilište</ManagementButton>
          <ManagementButton icon={active ? 'lock' : 'unlock'} className={active ? 'site-close' : 'site-open'} onClick={() => setConfirmation(true)}>{active ? 'Zatvori gradilište' : 'Otvori gradilište'}</ManagementButton></div>
      </>}
    </div>
    <div className="construction-site-actions">{actions.map(([label, icon], index) => <button type="button" key={label} onClick={() => sectionAction(index)}>{icon === 'clock' ? <MaterialIcon name="clock" size={32}/> : <Icon name={icon}/>}<span>{label}</span></button>)}</div>
    {confirmation && <Modal className="construction-site-status-dialog" title={active ? 'Zatvori gradilište?' : 'Otvori gradilište?'} busy={busy} onClose={() => setConfirmation(false)} actions={<>
      <ManagementButton icon="close" disabled={busy} onClick={() => setConfirmation(false)}>Otkaži</ManagementButton>
      <ManagementButton icon={active ? 'lock' : 'unlock'} className={active ? 'site-close' : 'site-open'} disabled={busy} onClick={updateStatus}>{active ? 'Zatvori' : 'Otvori'}</ManagementButton>
    </>}><p>{site.getName()}</p></Modal>}
  </section>;
}
