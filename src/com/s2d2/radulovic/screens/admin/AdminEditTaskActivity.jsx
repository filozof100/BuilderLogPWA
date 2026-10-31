import React, { useRef, useState } from 'react';
import { Title, Icon, MaterialIcon, mutate } from './AdminShared.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import { showToast } from '../../ui/components/Toast.jsx';
import './TaskCreationActivity.css';
import './AdminEditTaskActivity.css';

export function AdminEditTaskButton({ onClick }) {
  return <button type="button" className="admin-task-edit-button" aria-label="Izmeni zadatak" onClick={event => { event.stopPropagation(); onClick(); }}><MaterialIcon name="edit" size={22}/></button>;
}

export function useAdminTaskEditor(onReturn) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const close = () => { setEditing(null); onReturn(); };
  useBackLayer(!!editing, close, busy);
  return {
    editing: !!editing,
    editTask(task, assignment) { if (task.getId() > 0) setEditing({ task, assignment }); },
    editor: editing && <AdminEditTaskActivity key={editing.task.getId()} {...editing} onCancel={close} onSaved={close} onBusy={setBusy}/>,
  };
}

export default function AdminEditTaskActivity({ task, assignment, onCancel, onSaved, onBusy }) {
  const [title, setTitle] = useState(task.getTitle());
  const [description, setDescription] = useState(task.getDescription());
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false), form = useRef(null);
  const invalid = value => !value.trim() || value === '-';
  function save(event) {
    event.preventDefault();
    if (lock.current || !title.trim() || !description.trim()) return;
    setSubmitted(true);
    if (invalid(title) || invalid(description)) {
      const input = form.current.querySelector(invalid(title) ? '[name=title]' : '[name=description]');
      input.focus({ preventScroll: true }); input.scrollIntoView({ block: 'nearest' });
      return;
    }
    lock.current = true; setSaving(true); onBusy(true);
    mutate('PATCH', 'tasks/' + task.getId(), { title: title.trim(), description: description.trim() }, {
      onSuccess() { lock.current = false; setSaving(false); onBusy(false); showToast('Zadatak je uspešno ažuriran'); onSaved(); },
      onFailure() { lock.current = false; setSaving(false); onBusy(false); showToast('Ažuriranje zadatka nije uspelo'); },
    });
  }
  return <form ref={form} className="admin-screen admin-task-edit" onSubmit={save} noValidate>
    <Title title="IZMENA ZADATKA" icon="ic_tasks_black"/>
    <div className="admin-task-assignment">{assignment}</div>
    {[['title', 'Naziv *', title, setTitle], ['description', 'Opis *', description, setDescription]].map(([name, label, value, change]) => {
      const Control = name === 'title' ? 'input' : 'textarea';
      const error = (submitted || touched[name]) && invalid(value);
      return <label className="admin-task-input" key={name}><span>{label}</span>
        <Control name={name} value={value} placeholder={name === 'title' ? 'Unesite naziv' : 'Unesite opis'} autoComplete="off" autoCapitalize="sentences" aria-required="true" aria-invalid={!!error} onChange={event => change(event.target.value)} onBlur={() => setTouched(previous => ({ ...previous, [name]: true }))}/>
        {error && <small className="error-message">Obavezno polje.</small>}
      </label>;
    })}
    <div className="admin-task-edit-actions"><button type="button" disabled={saving} onClick={onCancel}>Otkaži</button><button type="submit" disabled={saving || !title.trim() || !description.trim()}><Icon name="ic_save"/>Sačuvaj</button></div>
  </form>;
}
