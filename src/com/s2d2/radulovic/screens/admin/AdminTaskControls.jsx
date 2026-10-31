import React, { useEffect, useMemo, useRef } from 'react';
import Role from '../../employee/Role.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
const tabs = ['Opšti', 'Za šefa', 'Za gradilište', 'Za bageristu', 'Za vozača kamiona'];
export const workerRoles = { 1: Role.SITE_MANAGER, 3: Role.OPERATOR, 4: Role.TRUCK_DRIVER };
export const workerLabels = { 1: ['Šef gradilišta', 'Izaberite šefa gradilišta', 'Nije odabran šef gradilišta.'], 3: ['Bagerista', 'Izaberite bageristu', 'Nije odabran bagerista.'], 4: ['Vozač kamiona', 'Izaberite vozača kamiona', 'Nije odabran vozač kamiona.'] };

export default function AdminTaskControls({ tab, setTab, site, setSite, selectedWorkers, setSelectedWorkers, sites, workers, required = false, validation = {}, onFieldBlur }) {
  const tabBar = useRef(null);
  const options = useMemo(() => workers.data.filter(worker => worker.getRole() === (workerRoles[tab] || Role.SITE_MANAGER))
    .map(worker => ({ worker, getName: () => worker.getFullName() })), [workers.data, tab]);
  const workerTab = !!workerRoles[tab];
  const labels = workerLabels[tab] || workerLabels[1];
  useEffect(() => {
    const bar = tabBar.current;
    const button = bar.children[tab];
    const left = button.offsetLeft;
    if (left < bar.scrollLeft) bar.scrollTo({ left, behavior: 'smooth' });
    else if (left + button.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: left + button.offsetWidth - bar.clientWidth, behavior: 'smooth' });
  }, [tab]);
  return <>
    <TaskSelectionValidation enabled={required} field="site" invalid={validation.site} onBlur={onFieldBlur}>
    <div className={'admin-task-picker' + (tab !== 2 ? ' disabled' : '') + (!site ? ' placeholder' : '')}>
      <SelectionDropdown label={required && tab === 2 ? "Gradilište *" : "Gradilište"} placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={[...sites.data].sort((a, b) => Number(b.canSelect()) - Number(a.canSelect()))} selected={site} onSelected={setSite} disabled={tab !== 2} optionEnabled={site => site.canSelect()}/>
    </div>
    </TaskSelectionValidation>
    <TaskSelectionValidation enabled={required} field="worker" invalid={validation.worker} onBlur={onFieldBlur}>
    <div className={'admin-task-picker' + (!workerTab ? ' disabled' : '') + (!(selectedWorkers[workerTab ? tab : 1]) ? ' placeholder' : '')}>
      <SelectionDropdown key={tab} label={labels[0] + (required && workerTab ? " *" : "")} placeholder={labels[1]} icon="ic_site_manager_black" variant="worker" options={options} selected={options.find(option => option.worker.getId() === selectedWorkers[workerTab ? tab : 1]?.getId())} onSelected={option => setSelectedWorkers(values => ({ ...values, [tab]: option.worker }))} disabled={!workerTab} emptyText={workers.loading ? 'Učitavanje...' : 'Nema dostupnih radnika.'} maxMenuHeight={220}/>
    </div>
    </TaskSelectionValidation>
    <div className="admin-task-tabs" role="tablist" aria-label="Vrsta zadataka" ref={tabBar}>{tabs.map((label, index) => <button key={label} type="button" role="tab" aria-selected={tab === index} onClick={() => { setTab(index); }}>{label}</button>)}</div>
  </>;
}


function TaskSelectionValidation({enabled,field,invalid,onBlur,children}) {
  if(!enabled)return children;
  return <div className="admin-task-validation" data-task-field={field} role="group"
    aria-label={field === 'site' ? 'Gradilište' : 'Zaposleni'}
    aria-invalid={!!invalid} aria-describedby={invalid ? 'task-error-' + field : undefined}
    onBlur={event => { if(!event.currentTarget.contains(event.relatedTarget))onBlur?.(field); }}>
    {children}
    {invalid && <span id={'task-error-' + field} className="task-selection-error">Obavezno polje.</span>}
  </div>;
}
