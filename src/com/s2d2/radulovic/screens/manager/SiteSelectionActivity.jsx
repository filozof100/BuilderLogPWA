import { showToast } from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';

export default function SiteSelectionActivity({ onSelected }) {
  const [sites, setSites] = useState([]);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Session.getAssignedSitesFromServer({
      onSuccess(items) {
        if (!active) return;
        setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]);
        setLoading(false);
      },
      onFailure() {
        if (!active) return;
        setLoading(false); setError('Učitavanje nije uspelo. Pokušajte ponovo.');
      },
    });
    return () => { active = false; };
  }, [attempt]);

  function submit() {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => {
      if (!mounted.current) return;
      lock.current = false; setSaving(false); showToast('Dnevni izveštaj nije kreiran');
    };
    try {
      Session.getSessionDate();
      Session.setDefaultConstructionSite(site);
      Session.createDefaultDailyLog({
        onSuccess(dailyLog) { if (mounted.current) onSelected(site, dailyLog); },
        onFailure: fail,
      });
    } catch { fail(); }
  }

  return <section className="selection-body" aria-label="Izbor gradilišta za poslovođu" aria-busy={loading || saving}>
    <div className="selection-form">
      <SelectionDropdown label="Izaberite gradilište na kome danas radite" placeholder="Izaberite gradilište"
        icon="ic_construction_site_crane" options={sites} selected={site} onSelected={setSite}
        optionEnabled={option => option.canSelect()} disabled={loading || saving}
        emptyText={loading ? undefined : 'Nema dostupnih gradilišta.'} />
      <button type="button" className="primary-button" disabled={!site || loading || saving} onClick={submit}>Potvrdi</button>
      
    </div>
  </section>;
}
