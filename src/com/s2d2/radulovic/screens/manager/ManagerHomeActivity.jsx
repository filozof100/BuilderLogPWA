import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useEffect, useRef, useState } from 'react';
import SubcontractorsActivity from './SubcontractorsActivity.jsx';
import ManagerMachinesScreen from './ManagerMachinesScreen.jsx';
import TasksActivity from './TasksActivity.jsx';
import NotesActivity from './NotesActivity.jsx';
import ExpensesActivity from './ExpensesActivity.jsx';
import DocumentsActivity from './DocumentsActivity.jsx';
import DeliveryNotesActivity from './DeliveryNotesActivity.jsx';
import WorkersActivity from './WorkersActivity.jsx';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import { SettingsIcon } from '../../ui/components/SettingsAccessBar.jsx';
import Modal from '../../ui/components/Modal.jsx';
import './ManagerHomeActivity.css';

const menu = [
  ['ic_site_manager_black', 'RADNICI'],
  ['ic_document_lines_black', 'OTPREMNICE'],
  ['ic_folder_simple_black', 'DOKUMENTI'],
  ['ic_wallet_black', 'TROŠKOVI'],
  ['ic_diary', 'GRAĐEVINSKI DNEVNIK'],
  ['ic_tasks_black', 'ZADACI ADMINA'],
  ['ic_excavator_black', 'RADNE MAŠINE'],
  ['ic_workers_black_no_bg_original_proportions', 'PODIZVOĐAČI'],
];

export default function ManagerHomeActivity({ onSettings, active = true }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [sites, setSites] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [section, setSection] = useState(null);
  const childScreenOpen = section === 'RADNICI' || section === 'OTPREMNICE' || section === 'DOKUMENTI' || section === 'TROŠKOVI' || section === 'GRAĐEVINSKI DNEVNIK' || section === 'ZADACI ADMINA' || section === 'RADNE MAŠINE' || section === 'PODIZVOĐAČI';
  useBackLayer(childScreenOpen, () => setSection(null));
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    let live = true;
    function refresh() {
      if (!active || childScreenOpen || document.visibilityState === 'hidden') return;
      Session.getNewTasksCountFromServer({
        onSuccess(value) { if (live) setCount(Math.max(0, value)); },
        onFailure() {},
      });
    }
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; document.removeEventListener('visibilitychange', refresh); };
  }, [active, childScreenOpen]);

  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    Session.getAssignedSitesFromServer({
      onSuccess(items) {
        if (!live) return;
        setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]);
        setLoading(false);
        const current = items.find(item => item.getId() === Session.getDefaultConstructionSite()?.getId() && item.canSelect());
        if (current) setSite(current);
        else {
          const first = items.find(item => item.canSelect());
          if (first) changeSite(first);
          else setSite(null);
        }
      },
      onFailure() { if (live) { setLoading(false); setError('Učitavanje gradilišta nije uspelo.'); } },
    });
    return () => { live = false; };
  }, [attempt]);

  function changeSite(next) {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const previous = Session.getDefaultConstructionSite();
    const fail = () => {
      if (!mounted.current) return;
      Session.setDefaultConstructionSite(previous);
      lock.current = false; setSaving(false); showToast('Dnevni izveštaj nije kreiran');
    };
    try {
      Session.getSessionDate();
      Session.setDefaultConstructionSite(next);
      Session.createDefaultDailyLog({
        onSuccess() { if (mounted.current) { setSite(next); lock.current = false; setSaving(false); } },
        onFailure: fail,
      });
    } catch { fail(); }
  }

  if (section === 'PODIZVOĐAČI') return <SubcontractorsActivity onBack={() => setSection(null)} />;
  if (section === 'RADNE MAŠINE') return <ManagerMachinesScreen onBack={() => setSection(null)} />;
  if (section === 'ZADACI ADMINA') return <TasksActivity onBack={() => setSection(null)} />;
  if (section === 'GRAĐEVINSKI DNEVNIK') return <NotesActivity onBack={() => setSection(null)} />;
  if (section === 'TROŠKOVI') return <ExpensesActivity onBack={() => setSection(null)} />;
  if (section === 'DOKUMENTI') return <DocumentsActivity onBack={() => setSection(null)} />;
  if (section === 'OTPREMNICE') return <DeliveryNotesActivity onBack={() => setSection(null)} />;
  if (section === 'RADNICI') return <WorkersActivity onBack={() => setSection(null)} />;

  return <section className="manager-home">
    <header className="manager-header">
      <img className="manager-logo" src="/assets/drawable/radulovic_logo.svg" alt="Radulovic logo" />
      <h1>Radulović gradnja</h1>
      <button className="manager-notifications" aria-label="Obaveštenja" onClick={() => setSection('Obaveštenja')}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1Zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5Z" /></svg>
      </button>
      <button className="settings-icon-button" aria-label="Podešavanja" onClick={onSettings}><SettingsIcon /></button>
    </header>
    <div className="manager-home-content">
      <div className="manager-role-row">
        <img src="/assets/drawable/ic_site_manager.svg" alt="Šef gradilišta" />
        <strong className="manager-name">{Session.getCurrentUser().getFullName()}</strong>
        <button className="manager-admin-tasks" onClick={() => setSection('ZADACI ADMINA')}>
          <span className="manager-task-emoji" aria-hidden="true">📋</span>
          <span><strong>ZADACI ADMINA</strong><small>{count > 0 ? 'Novih zadataka: ' + count : 'Nema novih zadataka'}</small></span>
        </button>
      </div>
      <div className="manager-site-picker">
        <SelectionDropdown label="Izaberite gradilište" placeholder="Učitavanje..." icon="ic_construction_site_crane"
          maxMenuHeight={180} options={sites} selected={site} onSelected={changeSite} optionEnabled={item => item.canSelect()}
          disabled={loading || saving} emptyText={loading ? undefined : 'Nema dostupnih gradilišta.'} />
        
      </div>
      <nav className="manager-menu" aria-label="Meni poslovođe">
        {menu.map(([icon, title]) => <button className="manager-menu-tile" key={title} onClick={() => setSection(title)}>
          <img src={'/assets/drawable/' + icon + '.svg'} alt="" /><span>{title}</span>
        </button>)}
      </nav>
    </div>
    {section && <Modal title={section} onClose={() => setSection(null)}
      actions={<button className="text-button confirm-button" onClick={() => setSection(null)}>OK</button>}>
      <p>{section === 'Obaveštenja' ? 'Obaveštenja još nisu dostupna u ovoj verziji aplikacije.' : 'Ovaj ekran još nije dostupan u ovoj verziji aplikacije.'}</p>
    </Modal>}
  </section>;
}
