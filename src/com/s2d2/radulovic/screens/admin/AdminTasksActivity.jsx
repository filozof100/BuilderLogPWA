import { AdminTaskRow } from './AdminTaskRow.jsx';
import { useAdminTaskEditor } from './AdminEditTaskActivity.jsx';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useState } from 'react';
import { TaskDetails } from '../manager/TasksActivity.jsx';
import Session from '../../network/Session.js';
import AdminTaskControls, { workerRoles, workerLabels } from './AdminTaskControls.jsx';
import TaskCreationActivity from './TaskCreationActivity.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import Modal from '../../ui/components/Modal.jsx';
import { Title, Icon, Notice, useLoad, mutate } from './AdminShared.jsx';
import './AdminTasksActivity.css';


export default function AdminTasksActivity() {
  const [tab, setTab] = useState(0);
  const [site, setSite] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState({});
  const [removing, setRemoving] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removed, setRemoved] = useState([]);
  const [creating, setCreating] = useState(false);
  const [creatingBusy, setCreatingBusy] = useState(false);
  useBackLayer(creating, () => setCreating(false), creatingBusy);
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const workers = useLoad(cb => Session.getAllWorkersFromServerAdmin(cb), [], []);
  const workerTab = !!workerRoles[tab];
  const worker = workerTab ? selectedWorkers[tab] : null;
  const labels = workerLabels[tab] || workerLabels[1];
  const tasks = useLoad(cb => Session.getAllTasksFromServerAdmin(worker, site, {
    onSuccess(general, personal, siteTasks) { cb.onSuccess(tab === 0 ? general : tab === 2 ? siteTasks : personal); },
    onFailure: cb.onFailure,
  }), [tab, worker, site], []);
  const { editing, editTask, editor } = useAdminTaskEditor(tasks.reload);
  const assignment = tab === 0 ? 'Opšti' : 'Za: ' + (tab === 2 ? site?.getName() ?? '' : worker?.getFullName() ?? '');
  useForegroundRefresh(tasks.reload, !creating && !editing);
  const visible = tasks.data.filter(task => !removed.includes(task.getId()));
  const missing = tab === 2 && !site ? 'Nije odabrano gradilište.' : workerTab && !worker ? labels[2] : null;
  function remove() {
    setBusy(true); setError('');
    mutate('DELETE', 'tasks/' + removing.getId(), { reason: 'Admin obrisao' }, {
      onSuccess() { setRemoved(ids => [...ids, removing.getId()]); setBusy(false); setRemoving(null); setNotice('Zadatak je obrisan'); },
      onFailure() { setBusy(false); showToast('Brisanje zadatka nije uspelo'); },
    });
  }
  if (creating) return <TaskCreationActivity initialTab={tab} initialSite={site} initialWorker={worker} onBusy={setCreatingBusy} onSaved={() => { setCreating(false); setNotice('Zadatak je kreiran'); tasks.reload(); }}/>;
  return <>{editor}<section className="admin-screen admin-tasks" style={editing ? { display: 'none' } : undefined}>
    <Title title="ZADACI" subtitle="Pregled i upravljanje zadacima." icon="ic_tasks_black"/>
    <AdminTaskControls tab={tab} setTab={index => { setTab(index); setNotice(''); }} site={site} setSite={setSite} selectedWorkers={selectedWorkers} setSelectedWorkers={setSelectedWorkers} sites={sites} workers={workers}/>
    <button type="button" className="admin-task-add" onClick={() => setCreating(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>Dodaj novi zadatak</button>
    
    
    <Toast message={notice} onDismiss={() => setNotice('')}/>
    {missing ? <Notice>{missing}</Notice> : <>
      
      <TaskGroup title="Nezavršeni" tasks={visible.filter(task => !task.isCompleted())} loading={tasks.loading} onOpen={setSelected} onEdit={task => editTask(task, assignment)} onDelete={task => { setRemoving(task); setError(''); }}/>
      <TaskGroup title="Završeni" completed tasks={visible.filter(task => task.isCompleted())} loading={tasks.loading} onOpen={setSelected} onEdit={task => editTask(task, assignment)} onDelete={task => { setRemoving(task); setError(''); }}/>
    </>}
    {selected && <TaskDetails task={{ name: selected.getTitle(), description: selected.getDescription(), assignedAt: selected.getDateCreated() }} onClose={() => setSelected(null)}/>}
    {removing && <Modal className="admin-task-delete" title="Obriši zadatak?" busy={busy} onClose={() => setRemoving(null)} actions={<>
      <button type="button" disabled={busy} onClick={() => setRemoving(null)}>Otkaži</button>
      <button type="button" className="admin-task-delete-confirm" disabled={busy} onClick={remove}>{busy ? 'Brisanje...' : 'Obriši'}</button>
    </>}><p>Da li ste sigurni da želite da obrišete zadatak {removing.getTitle()}?</p>{error && <p className="error-message" role="alert">{error}</p>}</Modal>}
  </section></>;
}

function TaskGroup({ title, tasks, loading, completed = false, onDelete, onOpen, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  return <div className={'admin-task-group' + (completed ? ' completed' : '')}>
    <button type="button" className="admin-task-group-heading" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      <span><strong>{title}</strong><small>{loading ? 'Učitavanje zadataka...' : 'Broj zadataka: ' + tasks.length}</small></span><Icon name={expanded ? 'ic_chevron_down' : 'ic_chevron_right'}/>
    </button>
    {expanded && !loading && (tasks.length ? tasks.map(task => <AdminTaskRow key={task.getId()} task={task} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete}/>) : <Notice>Nema zadataka.</Notice>)}
  </div>;
}
