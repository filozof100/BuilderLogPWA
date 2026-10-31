import LoadFailureToast from '../../LoadFailureToast.jsx';
import { AdminEditTaskButton, useAdminTaskEditor } from './AdminEditTaskActivity.jsx';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import React, { useState } from 'react';
import { TaskDetails } from '../manager/TasksActivity.jsx';
import Session from '../../network/Session.js';
import { Title, Icon, Notice, useLoad } from './AdminShared.jsx';
import './AdminConstructionSiteTasksActivity.css';

export default function AdminConstructionSiteTasksActivity({ constructionSite }) {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(null);
  const tasks = useLoad(cb => Session.getConstructionSiteTasksFromServerAdmin(constructionSite.getId(), cb), [constructionSite.getId()], []);
  const { editing, editTask, editor } = useAdminTaskEditor(tasks.reload);
  useForegroundRefresh(tasks.reload, !editing);
  return <>{editor}<section className="admin-screen admin-construction-site-tasks" style={editing ? { display: 'none' } : undefined}>
    <Title title="ZADACI GRADILIŠTA" subtitle="Pregled zadataka za izabrano gradilište." icon="ic_tasks_black"/>
    <article className="site-tasks-owner"><Icon name="ic_construction_site_crane"/><div><small>GRADILIŠTE</small><strong>{constructionSite.getName().trim() || '-'}</strong></div></article>
    {tasks.error ? <LoadFailureToast message="Učitavanje zadataka nije uspelo."/> : [false, true].map(done => {
      const rows = tasks.data.filter(task => task.isCompleted() === done);
      return <div className={'site-tasks-group ' + (done ? 'completed' : 'incomplete')} key={String(done)}>
        <button type="button" className="site-tasks-heading" aria-expanded={expanded === done} onClick={() => setExpanded(expanded === done ? null : done)}>
          <span><strong>{done ? 'Završeni' : 'Nezavršeni'}</strong><small>{tasks.loading ? 'Učitavanje zadataka...' : 'Broj zadataka: ' + rows.length}</small></span>
          <Icon name={expanded === done ? 'ic_chevron_down' : 'ic_chevron_right'}/>
        </button>
        {expanded === done && !tasks.loading && (!rows.length ? <div className="site-tasks-empty" role="status">Nema zadataka.</div> : rows.map(task => <article className="site-task-row" key={task.getId()} role="button" tabIndex={0} onClick={() => setSelected(task)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelected(task); } }}>
          <div><strong>{task.getTitle()}</strong>{task.getDescription().trim() && <p>{task.getDescription()}</p>}
            <small>{done ? 'Završen: ' + (task.getCompletedDate() || '-') : 'Zadato: ' + (task.getDateCreated() || '-')}</small>
            {done && <b>Završio: {task.getCompletedBy()?.getFullName().trim() || '-'}</b>}
          </div><AdminEditTaskButton onClick={() => editTask(task, 'Za: ' + constructionSite.getName())}/><span>{done ? 'Završen' : 'Aktivan'}</span>
        </article>))}
      </div>;
    })}
    {selected && <TaskDetails task={{ name: selected.getTitle(), description: selected.getDescription(), assignedAt: selected.getDateCreated() }} onClose={() => setSelected(null)}/>}
  </section></>;
}
