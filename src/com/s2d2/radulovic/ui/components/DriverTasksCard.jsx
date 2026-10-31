import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import Modal from './Modal.jsx';

export default function DriverTasksCard({ expanded, onExpandedChange }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reload, setReload] = useState(0);
  const pending = useRef(new Set());
  useEffect(() => {
    let active = true;
    setLoading(true);
    Session.getAllTasksFromServer({
      onSuccess(generalTasks, managerTasks) {
        if (!active) return;
        setTasks(managerTasks.map(task => ({ id: task.getId(), title: task.getTitle(), description: task.getDescription(),
          date: task.getDateCreated(), done: task.isCompleted(), visited: task.isNotificationVisited() })));
        setLoading(false); setError('');
      },
      onFailure() { if (active) { setLoading(false); setError('Neuspešno učitavanje zadataka'); } },
    });
    return () => { active = false; };
  }, [reload]);
  function update(task, action) {
    const key = task.id + '/' + action;
    if (task.id <= 0 || pending.current.has(key)) return;
    pending.current.add(key);
    if (action !== 'read') setTasks(previous => previous.map(item => item.id === task.id ? { ...item, updating: true } : item));
    const fail = () => {
      pending.current.delete(key);
      setTasks(previous => previous.map(item => item.id === task.id ? { ...item, updating: false } : item));
      setError('Neuspešno čuvanje zadatka');
    };
    try {
      WebUtils.sendPATCHRequest('my/tasks/' + key, '{}', { Authorization: Session.getSessionToken() }, {
        onSuccess() {
          pending.current.delete(key);
          setTasks(previous => previous.map(item => item.id !== task.id ? item : { ...item,
            ...(action === 'read' ? { visited: true } : { done: action === 'complete', updating: false }) }));
        }, onFailure: fail,
      });
    } catch { fail(); }
  }
  function toggleExpanded() {
    onExpandedChange(!expanded);
    if (!expanded) tasks.filter(task => !task.visited).forEach(task => update(task, 'read'));
  }
  return <section className="work-card tasks-card">
    <button className="card-heading" aria-expanded={expanded} onClick={toggleExpanded}>
      <span>Zadaci admina</span>{tasks.some(task => !task.visited) && <span className="unread-dot" aria-label="Nepročitani zadaci" />}
      <span className="task-count">{tasks.filter(task => !task.done).length}</span>
      <img className="work-icon" src={'/assets/drawable/ic_chevron_' + (expanded ? 'down' : 'right') + '.svg'} alt="" />
    </button>
    
    {expanded && <>
      {loading ? <p className="driver-tasks-notice">Učitavanje zadataka...</p> : !tasks.length && !error && <p className="driver-tasks-notice">Nema zadataka.</p>}
      {[...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date)).map(task => <div className="driver-task" key={task.id}>
        <input type="checkbox" aria-label={task.title} checked={task.done} disabled={task.updating} onChange={() => { onExpandedChange(false); update(task, task.done ? 'reopen' : 'complete'); }} />
        <button className="task-description" onClick={() => { setSelected(task); onExpandedChange(false); }}>
          <strong>{task.title}</strong><span>{task.description}</span><small>{task.date}</small>
        </button>
      </div>)}
    </>}
    {selected && <Modal className="task-dialog" title={selected.title} onClose={() => setSelected(null)}
      actions={<button className="text-button confirm-button" onClick={() => setSelected(null)}>OK</button>}>
      <small className="muted">{selected.date}</small><p className="preserve-lines">{selected.description}</p>
    </Modal>}
  </section>;
}
