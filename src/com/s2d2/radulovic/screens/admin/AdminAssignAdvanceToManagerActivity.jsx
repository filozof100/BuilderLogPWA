import { dateSortTimestamp } from '../../utils/DateSorting.js';
import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useMemo, useRef, useState } from 'react';
import AdminNewAdvanceActivity from './AdminNewAdvanceActivity.jsx';
import Session from '../../network/Session.js';
import Modal from '../../ui/components/Modal.jsx';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import { Title, Icon, Notice, DateField, useLoad, mutate, today, monthStart, money } from './AdminShared.jsx';
import './AdminTasksActivity.css';
import './AdminConstructionSiteExpensesActivity.css';
import './AdminAssignAdvanceToManagerActivity.css';

export default function AdminAssignAdvanceToManagerActivity({ worker = null, initialFrom, initialTo, onBack }) {
  const [manager, setManager] = useState(worker);
  const [from, setFrom] = useState(initialFrom || monthStart);
  const [to, setTo] = useState(initialTo || today);
  const [editor, setEditor] = useState(null);
  const [remove, setRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const filtersLocked = !!(worker && initialFrom && initialTo);
  const managers = useLoad(cb => Session.getAllManagersFromServer(cb), [], []);
  const options = useMemo(() => managers.data.map(worker => ({ worker, getName: () => worker.getFullName() })), [managers.data]);
  const advances = useLoad(cb => manager ? Session.getAdvancesForManager(manager.getId(), from, to, cb) : cb.onSuccess([]), [manager, from, to], []);
  const rows = advances.loading ? [] : [...advances.data].sort((a, b) => dateSortTimestamp(b.getDate()) - dateSortTimestamp(a.getDate()));
  useBackLayer(!!editor, () => setEditor(null), busy);
  function request(method, path, body) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    mutate(method, path, body, {
      onSuccess() { lock.current = false; setBusy(false); setEditor(null); setRemove(null); advances.reload(); if(method === 'DELETE') setNotice('Akontacija je obrisana'); else if(method === 'POST') setNotice('Akontacija je sačuvana'); else showToast('Akontacija je izmenjena'); },
      onFailure() { lock.current = false; setBusy(false); showToast(method === 'DELETE' ? 'Brisanje akontacije nije uspelo' : method === 'POST' ? 'Dodavanje akontacije nije uspelo' : 'Izmena akontacije nije uspela'); },
    });
  }
  if (editor === 'new') return <AdminNewAdvanceActivity manager={manager} busy={busy} error={error} onCancel={() => setEditor(null)} onSave={amount => request('POST', 'cash-advances', { site_manager_id: manager.getId(), amount, date: today() })}/>;
  if (editor) return <AdminNewAdvanceActivity manager={manager} advance={editor} busy={busy} error={error} onCancel={() => setEditor(null)} onSave={amount => request('PATCH', 'cash-advances/' + editor.getId(), { amount })}/>;
  return <section className="admin-screen admin-manager-advances admin-assign-manager">
    <Title title="ZADUŽI ŠEFA" subtitle="Akontacije i zaduženja za šefove gradilišta." icon="ic_wallet_black"/>
    <div className={'admin-task-picker assign-manager-picker' + (filtersLocked ? ' locked' : '') + (!manager ? ' placeholder' : '')}>
      <SelectionDropdown label="Šef gradilišta" placeholder="Izaberite šefa gradilišta" icon="ic_site_manager_black" variant={filtersLocked ? 'default' : 'worker'} options={options} selected={options.find(option => option.worker.getId() === manager?.getId()) || (manager ? { getName: () => manager.getFullName() } : null)} onSelected={option => { setManager(option.worker); setNotice(''); }} disabled={filtersLocked} emptyText={managers.loading ? 'Učitavanje...' : 'Nema dostupnih šefova gradilišta.'} maxMenuHeight={220}/>
    </div>
    
    <div className={'site-expense-period' + (filtersLocked ? ' locked' : '')}>
      <DateField label="Od" value={from} disabled={filtersLocked} onChange={value => { setFrom(value); if(value > to) setTo(value); }}/>
      <DateField label="Do" value={to} disabled={filtersLocked} onChange={value => { setTo(value); if(value < from) setFrom(value); }}/>
    </div>
    <div className="assign-manager-total"><span><Icon name="ic_costs_wallet_blue"/></span><div><strong>Ukupno zaduženje</strong><b>{money(rows.reduce((sum, row) => sum + row.getAmount(), 0))} RSD</b></div></div>
    <button type="button" className="assign-new-advance" disabled={!manager} onClick={() => { setError(''); setEditor('new'); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>Nova akontacija</button>
    <Toast message={notice} onDismiss={() => setNotice('')}/>
    <div className="assign-manager-list"><h2>Pregled akontacija</h2>
      {advances.error ? null : !manager || advances.loading || !rows.length ? <Notice>{!manager ? 'Nije odabran šef gradilišta.' : advances.loading ? 'Učitavanje akontacija...' : 'Nema akontacija za izabrani period.'}</Notice>
        : <div className="assign-advance-table" style={{height:Math.min(rows.length,4)*52}}>{rows.map(advance => <div className="assign-advance-row" key={advance.getId()}>
          <button type="button" className="assign-advance-edit" onClick={() => { setError(''); setEditor(advance); }}><span>{advance.getDate()}</span><b>{money(advance.getAmount())} RSD</b></button>
          <button type="button" className="assign-advance-delete" aria-label="Obriši akontaciju" onClick={() => { setError(''); setRemove(advance); }}><Icon name="ic_costs_trash"/></button>
        </div>)}</div>}
    </div>
    {remove && <Modal className="assign-advance-confirm" title="Brisanje akontacije" busy={busy} onClose={() => setRemove(null)} actions={<>
      <button type="button" disabled={busy} onClick={() => setRemove(null)}>Ne</button>
      <button type="button" className="confirm-button" disabled={busy} onClick={() => request('DELETE', 'cash-advances/' + remove.getId(), { reason: 'admin obrisao' })}>{busy ? 'Brisanje...' : 'Da'}</button>
    </>}><p>Da li ste sigurni da želite da obrišete akontaciju od {remove.getDate()} u iznosu {money(remove.getAmount())} RSD?</p>{error && <p className="error-message" role="alert">{error}</p>}</Modal>}
  </section>;
}
