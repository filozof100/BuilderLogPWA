import LoadFailureToast from '../../LoadFailureToast.jsx';
import AdminTruckDetailsActivity from './AdminTruckDetailsActivity.jsx';
import AdminExcavatorDetailsActivity from './AdminExcavatorDetailsActivity.jsx';
import AdminAddTruckActivity from './AdminAddTruckActivity.jsx';
import AdminAddExcavatorActivity from './AdminAddExcavatorActivity.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import { Title, Icon, Search, Notice, useLoad, mutate } from './AdminShared.jsx';
import './AdminMachinesActivity.css';

export default function AdminMachinesActivity() {
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [trucks, setTrucks] = useState(false);
  const [search, setSearch] = useState('');
  const [removed, setRemoved] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const listVisible = !selected && !adding;
  const machines = useLoad(cb => {
    if (!listVisible) { cb.onSuccess([]); return; }
    Session.getAllMachinesFromServer({ onSuccess(items) { setRemoved([]); cb.onSuccess(items); }, onFailure: cb.onFailure });
  }, [listVisible], []);
  useEffect(() => {
    if (!listVisible) return;
    const resume = () => { if (document.visibilityState === 'visible') machines.reload(); };
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, [listVisible]);
  const query = search.trim().toLocaleLowerCase();
  const rows = machines.data.filter(machine => machine.getType().toLowerCase() === (trucks ? 'truck' : 'excavator') && !removed.includes(machine.getMachineId()))
    .sort((a, b) => a.getName().toLocaleLowerCase().localeCompare(b.getName().toLocaleLowerCase()))
    .filter(machine => [machine.getName(), machine.getLicensePlate(), trucks ? 'Kamion' : 'Bager'].some(value => value.toLocaleLowerCase().includes(query)));
  function remove(machine) {
    if (lock.current) return;
    lock.current = true; setDeleting(machine.getMachineId()); setError(''); setNotice('');
    mutate('DELETE', 'machines/' + machine.getMachineId(), { reason: 'admin obrisao' }, {
      onSuccess() { setRemoved(ids => [...ids, machine.getMachineId()]); lock.current = false; setDeleting(null); setNotice(machine.getType() === 'truck' ? 'Kamion uspešno obrisan' : 'Bager uspešno obrisan'); },
      onFailure() { lock.current = false; setDeleting(null); setError('Brisanje mašine nije uspelo.'); },
    });
  }
  if (selected?.getType().toLowerCase() === 'truck') return <AdminTruckDetailsActivity machine={selected} onBack={() => setSelected(null)} onUpdated={machines.reload}/>;
  if (selected) return <AdminExcavatorDetailsActivity machine={selected} onBack={() => setSelected(null)} onUpdated={machines.reload}/>;
  if (adding && trucks) return <AdminAddTruckActivity onBack={() => setAdding(false)} onSaved={machines.reload}/>;
  if (adding) return <AdminAddExcavatorActivity onBack={() => setAdding(false)} onSaved={machines.reload}/>;
  return <section className="admin-screen admin-machines">
    <Title title="RADNE MAŠINE" subtitle="Pregled i upravljanje radnim mašinama." icon="ic_excavator_black"/>
    <Search value={search} onChange={setSearch} placeholder={trucks ? 'Pretraži kamione...' : 'Pretraži radne mašine...'}/>
    <button type="button" className="admin-machine-add" onClick={() => setAdding(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>{trucks ? 'Dodaj novi kamion' : 'Dodaj novi bager'}</button>
    <div className="admin-machine-tabs" role="tablist" aria-label="Vrsta mašine">{['BAGERI','KAMIONI'].map((label, i) => <button key={label} type="button" role="tab" aria-selected={trucks === !!i} onClick={() => { setTrucks(!!i); setNotice(''); setError(''); }}>{label}</button>)}</div>
    <Toast message={error} onDismiss={() => setError('')}/><Toast message={notice} onDismiss={() => setNotice('')}/>
    {machines.loading ? <Notice>{trucks ? 'Učitavanje kamiona...' : 'Učitavanje radnih mašina...'}</Notice> : machines.error ? <LoadFailureToast message={trucks ? 'Učitavanje kamiona nije uspelo.' : 'Učitavanje radnih mašina nije uspelo.'}/> : !rows.length ? <Notice>{trucks ? 'Nema dostupnih kamiona.' : 'Nema dostupnih radnih mašina.'}</Notice> : <div className="admin-machine-list">{rows.map(machine => <article className="admin-machine-row" key={machine.getMachineId()}>
      {trucks ? <button type="button" className="admin-truck-open" aria-label={'Aktivnost kamiona: ' + machine.getName()} onClick={() => setSelected(machine)}><span className="admin-machine-icon"><Icon name="ic_truck_black"/></span><div><strong>{machine.getName().trim() || '-'}</strong><small>{machine.getLicensePlate().trim() || '-'}</small></div></button> :
        <button type="button" className="admin-excavator-open" aria-label={'Aktivnost bagera: ' + machine.getName()} onClick={() => setSelected(machine)}><span className="admin-machine-icon"><Icon name="ic_excavator_black"/></span><div><strong>{machine.getName().trim() || '-'}</strong><small>{machine.getLicensePlate().trim() || '-'}</small></div></button>}
      <button type="button" aria-label="Obriši mašinu" disabled={deleting !== null} onClick={() => remove(machine)}><i aria-hidden="true"/></button>
    </article>)}</div>}
  </section>;
}
