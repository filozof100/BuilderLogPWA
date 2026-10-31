import React from 'react';
import { AdminEditTaskButton } from './AdminEditTaskActivity.jsx';
import { Icon } from './AdminShared.jsx';

export function AdminTaskRow({ task, onOpen, onEdit, onDelete }) {
  const by = task.getManagerCompletedBy?.() || task.getCompletedBy?.();
  return <article className="admin-task-row" key={task.getId()} role="button" tabIndex={0} onClick={() => onOpen(task)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onOpen(task); } }}>
    <div><strong>{task.getTitle()}</strong>{task.getDescription()?.trim() && <p>{task.getDescription()}</p>}
      <small>{task.isCompleted() ? 'Završen: ' + (task.getCompletedDate() || '-') : 'Zadato: ' + task.getDateCreated()}</small>
      {task.isCompleted() && by && <b>Završio: {by.getFullName()}</b>}
    </div>
    <aside><strong>{task.isCompleted() ? 'Završen' : 'Aktivan'}</strong><div className="admin-task-row-actions"><AdminEditTaskButton onClick={() => onEdit(task)}/><button type="button" aria-label="Obriši zadatak" onClick={event => { event.stopPropagation(); onDelete(task); }}><Icon name="ic_costs_trash"/></button></div></aside>
  </article>;
}
