import { dateSortTimestamp } from '../../utils/DateSorting.js';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import './DeliveryNotesActivity.css';
import './TasksActivity.css';

const groups = [['general', 'Opšti zadaci'], ['site', 'Zadaci za gradilište'], ['manager', 'Zadaci za šefa']];
export default function TasksActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [sites, setSites] = useState([]), [tasks, setTasks] = useState([]);
  const [expanded, setExpanded] = useState(null), [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [sitesError, setSitesError] = useState('');
  const [retry, setRetry] = useState(0), [pending, setPending] = useState(new Set());
  const locks = useRef(new Set()), generation = useRef(0);
  useEffect(() => {
    let active = true; setSitesError('');
    Session.getAssignedSitesFromServer({
      onSuccess(items) { if (active) setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]); },
      onFailure() { if (active) setSitesError('Učitavanje gradilišta nije uspelo.'); },
    });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    const current = ++generation.current;
    setTasks([]); setExpanded(null); setSelected(null); setError(''); setLoading(!!site); locks.current.clear(); setPending(new Set());
    if (site) Session.getAllTasksFromServer({
      onSuccess(general, manager, construction) {
        if (generation.current !== current) return;
        const convert = (items, type) => items.map(task => ({ id: task.getId(), type, name: task.getTitle(), description: task.getDescription(),
          assignedAt: task.getDateCreated(), completedAt: task.getCompletedDate(), done: task.isCompleted(), visited: task.isNotificationVisited(),
          completedBy: (type === 'general' ? task.getManagerCompletedBy() : task.getCompletedBy())?.getFullName() || '',
          siteId: type === 'site' ? task.getConstructionSiteId() : null }));
        setTasks([...convert(general, 'general'), ...convert(manager, 'manager'), ...convert(construction, 'site')].sort((a, b) => dateSortTimestamp(b.assignedAt, Infinity, true) - dateSortTimestamp(a.assignedAt, Infinity, true)));
        setLoading(false);
      },
      onFailure() { if (generation.current === current) { setLoading(false); setError('Učitavanje zadataka nije uspelo.'); } },
    });
    return () => { generation.current++; };
  }, [site, retry]);
  function mutate(task, action) {
    const key = task.id + '/' + (action === 'read' ? 'read' : 'status');
    if (locks.current.has(key)) return;
    locks.current.add(key); setPending(new Set(locks.current));
    const current = generation.current;
    const finish = () => { locks.current.delete(key); setPending(new Set(locks.current)); };
    const fail = () => {
      if (current !== generation.current) return;
      finish(); setError(action === 'read' ? 'Označavanje pročitanih zadataka nije uspelo.' : 'Promena statusa zadatka nije uspela.');
    };
    try {
      WebUtils.sendPATCHRequest('my/tasks/' + task.id + '/' + action, '{}', { Authorization: Session.getSessionToken() }, {
        onSuccess() {
          if (current !== generation.current) return;
          setTasks(previous => previous.map(item => item.id !== task.id ? item : action === 'read' ? { ...item, visited: true } :
            { ...item, done: action === 'complete', completedAt: action === 'complete' ? dateLabel(TimeUtils.formatDate(new Date())) : '',
              completedBy: action === 'complete' ? Session.getCurrentUser().getFullName() : '' }));
          finish();
        }, onFailure: fail,
      });
    } catch { fail(); }
  }
  const groupTasks = type => tasks.filter(task => task.type === type && (type !== 'site' || task.siteId === site?.getId()));
  function openGroup(type) {
    setError('');
    if (expanded === type) { setExpanded(null); return; }
    setExpanded(type); groupTasks(type).filter(task => !task.visited).forEach(task => mutate(task, 'read'));
  }
  function retryError() {
    if (error === 'Označavanje pročitanih zadataka nije uspelo.' && expanded) {
      setError(''); groupTasks(expanded).filter(task => !task.visited).forEach(task => mutate(task, 'read'));
    } else setRetry(value => value + 1);
  }
  return <section className="manager-tasks">
    <header className="delivery-title"><span><img className="manager-tasks-icon" src="/assets/drawable/ic_tasks_black.svg" alt="" /></span><div><h1>ZADACI</h1><p>Pregled zadataka koje je zadao admin.</p></div></header>
    <div className="manager-tasks-site manager-site-picker"><SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={sites} selected={site} onSelected={setSite} optionEnabled={item => item.canSelect()} disabled={pending.size > 0} maxMenuHeight={180} /></div>
    
    {groups.map(([type, title]) => {
      const items = groupTasks(type);
      return <div className={'manager-task-group task-group-' + type} key={type}>
        <button className="manager-task-group-heading" disabled={loading} aria-expanded={expanded === type} onClick={() => openGroup(type)}>
          <span><strong>{title}</strong><small>Aktivni {items.filter(task => !task.done).length} • Završeni {items.filter(task => task.done).length}</small></span>
          {items.some(task => !task.visited) && <i className="manager-task-unread" aria-label="Nepročitani zadaci" />}
          <img src={'/assets/drawable/ic_chevron_' + (expanded === type ? 'down' : 'right') + '.svg'} alt="" />
        </button>
        {expanded === type && [false, true].map(done => {
          const rows = items.filter(task => task.done === done);
          return <div className="manager-task-status" key={String(done)}><h2>{done ? 'Završeni' : 'Aktivni'} <span>{rows.length}</span></h2>
            {!rows.length ? <p className="delivery-notice">{done ? 'Nema završenih zadataka.' : 'Nema aktivnih zadataka.'}</p> : rows.map(task =>
              <article className="manager-task-row" key={task.id}>
                <label className="manager-task-checkbox"><input type="checkbox" checked={task.done} disabled={pending.has(task.id + '/status')} aria-label={(task.done ? 'Ponovo otvori: ' : 'Završi: ') + task.name} onChange={() => { setError(''); mutate(task, task.done ? 'reopen' : 'complete'); }} /></label>
                <button className="manager-task-text" onClick={() => { setExpanded(null); setSelected(task); }}><strong>{task.name}</strong><span>{task.description}</span>
                  <small>{task.done ? 'Završen: ' + (task.completedAt || '-') : 'Zadato: ' + task.assignedAt}</small>
                  {task.done && task.completedBy && <b>Završio: {task.completedBy}</b>}
                </button>
              </article>)}
          </div>;
        })}
      </div>;
    })}
    {selected && <TaskDetails task={selected} onClose={() => setSelected(null)} />}
  </section>;
}
export function TaskDetails({ task, onClose }) {
  useBackLayer(true, onClose);
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="manager-task-details" aria-label={task.name} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div><h2>{task.name}</h2><div className="manager-task-date"><span><img src="/assets/drawable/ic_calendar.svg" alt="" /></span><div><small>Zadato:</small><strong>{task.assignedAt.split(' ')[0]}</strong></div></div>
      <hr /><h3>Opis zadatka</h3><p>{task.description}</p><hr /><footer><button onClick={onClose}>Zatvori</button></footer>
    </div>
  </dialog>;
}
