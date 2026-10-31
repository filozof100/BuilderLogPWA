import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import WebUtils from '../../network/WebUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import StandardSiteDateControls from '../../ui/components/StandardSiteDateControls.jsx';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import './DeliveryNotesActivity.css';

export default function DeliveryNotesActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [date, setDate] = useState(() => TimeUtils.formatDate(new Date()));
  const [sites, setSites] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [log, setLog] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [setupError, setSetupError] = useState('');
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [preview, setPreview] = useState(null);
  useBackLayer(!!editor, () => { setEditor(null); setError(''); }, saving);
  const camera = useRef(null);
  const lock = useRef(false);
  const localUrls = useRef([]);
  useEffect(() => () => { localUrls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  useEffect(() => {
    let active = true;
    setSetupError(''); setSuppliersLoaded(false);
    Session.getAssignedSitesFromServer({
      onSuccess(items) { if (active) setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]); },
      onFailure() { if (active) setSetupError('Učitavanje gradilišta nije uspelo.'); },
    });
    Session.getAllSuppliersFromServer({
      onSuccess(items) { if (active) { setSuppliers([...items.filter(item => item.isActive()), ...items.filter(item => !item.isActive())]); setSuppliersLoaded(true); } },
      onFailure() { if (active) { setSetupError('Učitavanje dobavljača nije uspelo.'); setLoading(false); } },
    });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setLog(null); setNotes([]); setError('');
    if (!site || !suppliersLoaded) return () => { active = false; };
    setLoading(true);
    const fail = () => { if (active) { setLoading(false); setError('Učitavanje otpremnica nije uspelo.'); } };
    DailyLogUtils.createOrUpdateDailyLog(site, date, {
      onSuccess(dailyLog) {
        if (!active) return;
        setLog(dailyLog);
        Session.getDeliveryNotesForDailyLog(dailyLog, {
          onSuccess(items) {
            if (!active) return;
            setNotes(items.map(note => ({ id: note.getId(), name: note.getName(), description: note.getDescription(),
              date: note.getDate(), image: note.getUrl(), supplierId: note.getSupplierId(), supplierName: note.getSupplierName() })));
            setLoading(false);
          }, onFailure: fail,
        });
      }, onFailure: fail,
    });
    return () => { active = false; };
  }, [site, date, suppliersLoaded, retry]);

  function photoSelected(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    localUrls.current.push(url);
    setError(''); setEditor({ file, image: url, supplierId: null, name: '', description: '' });
  }
  function save(name, description, supplier) {
    if (!name.trim()) { showToast('Morate uneti naziv otpremnice.'); return; }
    if (!supplier) { showToast('Morate odabrati dobavljača.'); return; }
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => { lock.current = false; setSaving(false); setError('Čuvanje otpremnice nije uspelo.'); };
    const endpoint = 'daily-logs/' + log.getDailyLogId() + '/delivery-notes';
    const updatedDescription = description.trim() ? description : editor.id ? editor.description : 'Bez opisa';
    const done = () => { lock.current = false; setSaving(false); setEditor(null); };
    try {
      if (editor.id) {
        WebUtils.sendPATCHRequest(endpoint + '/' + editor.id, JSON.stringify({ supplier_id: supplier.getId(), name: name.trim(), description: updatedDescription, reason: 'korisnik ažurirao' }),
          { Authorization: Session.getSessionToken() }, {
            onSuccess() { setNotes(previous => previous.map(note => note.id === editor.id ? { ...note, name: name.trim(), description: updatedDescription, supplierId: supplier.getId(), supplierName: supplier.getName() } : note)); done(); },
            onFailure: fail,
          });
      } else {
        const body = new FormData();
        body.append('supplier_id', String(supplier.getId()));
        body.append('name', name.trim());
        body.append('description', updatedDescription);
        body.append('attachments[]', editor.file, 'delivery_note.' + (editor.file.name.split('.').pop() || 'jpg'));
        WebUtils.sendPOSTRequest(endpoint, body, { Authorization: Session.getSessionToken() }, {
          onSuccess(response) {
            try {
              const data = JSON.parse(response).data;
              setNotes(previous => [{ id: data.id, name: data.name ?? name.trim(), description: data.description ?? updatedDescription,
                date, image: data.attachments?.[0]?.download_url || editor.image, supplierId: data.supplier?.id ?? data.supplier_id ?? supplier.getId(),
                supplierName: data.supplier?.name ?? supplier.getName() }, ...previous]);
              done();
            } catch { fail(); }
          }, onFailure: fail,
        });
      }
    } catch { fail(); }
  }
  function remove() {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    const fail = () => { lock.current = false; setSaving(false); setError('Brisanje otpremnice nije uspelo.'); };
    try {
      WebUtils.sendDELETERequest('daily-logs/' + log.getDailyLogId() + '/delivery-notes/' + removing.id, JSON.stringify({ reason: 'korisnik obrisao' }),
        { Authorization: Session.getSessionToken() }, {
          onSuccess() { setNotes(previous => previous.filter(note => note.id !== removing.id)); setSaving(false); lock.current = false; },
          onFailure: fail,
        });
    } catch { fail(); }
    setRemoving(null);
  }

  const filtered = notes.filter(note => note.name.toLowerCase().includes(search.toLowerCase()) || (note.description || '').toLowerCase().includes(search.toLowerCase()));
  return <>
    {editor ? <DeliveryNoteForm key={editor.id || editor.image} note={editor} suppliers={suppliers} busy={saving} error={error}
      onClose={() => { setEditor(null); setError(''); }} onSave={save} onPreview={() => setPreview(editor.image)} /> :
      <section className="manager-delivery-notes">
        <DeliveryTitle title="OTPREMNICE" subtitle="Pregled i evidencija otpremnica materijala." onBack={onBack} />
        <StandardSiteDateControls sites={sites} site={site} onSiteSelected={setSite} date={date} onDateSelected={setDate} disabled={loading || saving} />
        <div className="delivery-search-row">
          <label className="delivery-search"><img src="/assets/drawable/ic_search.svg" alt="" /><input aria-label="Pretraži otpremnice" placeholder="Pretraži otpremnice..." value={search} onChange={event => setSearch(event.target.value)} /></label>
          <button className="delivery-new" disabled={!log || !suppliersLoaded || loading || saving} onClick={() => camera.current.click()}><b>+</b>Nova</button>
        </div>
        <input ref={camera} className="delivery-camera" type="file" accept="image/*" capture="environment" aria-label="Fotografija otpremnice" onChange={photoSelected} hidden />
        
        {loading ? <p className="delivery-notice">Učitavanje otpremnica...</p> : !filtered.length ? <p className="delivery-notice">Nema otpremnica za izabrani filter.</p> :
          <div className="delivery-list">{filtered.map(note => <article className="delivery-card" key={note.id} onClick={() => { setError(''); setEditor(note); }}>
            <button className="delivery-thumbnail" aria-label={'Slika: ' + note.name} disabled={!note.image} onClick={event => { event.stopPropagation(); setPreview(note.image); }}><AuthenticatedImage url={note.image} /></button>
            <button className="delivery-details" aria-label={'Izmeni: ' + note.name} onClick={() => { setError(''); setEditor(note); }}>
              <strong>{note.name}</strong><span>{note.description}</span><b>{note.supplierName}</b><small>{note.date?.length >= 10 ? dateLabel(note.date.slice(0, 10)) : note.date}</small>
            </button>
            <button className="delivery-delete" aria-label={'Obriši: ' + note.name} onClick={event => { event.stopPropagation(); setError(''); setRemoving(note); }}><img src="/assets/drawable/ic_costs_trash.svg" alt="" /></button>
          </article>)}</div>}
      </section>}
    {removing && <Modal title="Brisanje otpremnice" busy={saving} onClose={() => { setRemoving(null); setError(''); }}
      actions={<><button className="text-button" disabled={saving} onClick={() => { setRemoving(null); setError(''); }}>Ne</button><button className="text-button confirm-button" disabled={saving} onClick={remove}>Da</button></>}>
      <p>Da li ste sigurni da želite da obrišete ovu otpremnicu?</p>
    </Modal>}
    {preview && <ImagePreview image={preview} onClose={() => setPreview(null)} />}
  </>;
}
function DeliveryTitle({ title, subtitle, onBack, busy }) {
  return <header className="delivery-title">
    <span><img src="/assets/drawable/ic_document_lines_black.svg" alt="" /></span><div><h1>{title}</h1><p>{subtitle}</p></div>
  </header>;
}
function DeliveryNoteForm({ note, suppliers, busy, error, onClose, onSave, onPreview }) {
  const [name, setName] = useState(note.name);
  const [description, setDescription] = useState(note.description);
  const [supplier, setSupplier] = useState(() => suppliers.find(item => item.getId() === note.supplierId) ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const nameInvalid = !name.trim() || name === '-';
  const nameError = (submitted || touched.name) && nameInvalid;
  const supplierError = (submitted || touched.supplier) && !supplier;
  const touch = key => setTouched(previous => ({ ...previous, [key]: true }));
  const nameRef = useRef(null);
  const supplierRef = useRef(null);
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    const invalidControl = !supplier ? supplierRef.current.querySelector('.selection-field')
      : nameInvalid ? nameRef.current : null;
    if (!supplier || nameInvalid) {
      requestAnimationFrame(() => {
        invalidControl?.focus({ preventScroll: true });
        invalidControl?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    setSubmitted(false); setTouched({});
    onSave(name, description, supplier);
  }
  return <section className="delivery-note-form">
    <DeliveryTitle title={note.id ? 'IZMENI OTPREMNICU' : 'NOVA OTPREMNICA'} subtitle="Unos otpremnice i osnovnih podataka." onBack={onClose} busy={busy} />
    <form onSubmit={submit} noValidate>
      <div className="delivery-form-card">
        <button type="button" className="delivery-form-image" disabled={!note.image || busy} aria-label="Prikaži sliku otpremnice" onClick={onPreview}><AuthenticatedImage url={note.image} /></button>
        <div className="delivery-supplier manager-site-picker" ref={supplierRef} role="group" aria-label="Dobavljač"
          aria-invalid={!!supplierError} aria-describedby={supplierError ? 'delivery-supplier-error' : undefined}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) touch('supplier'); }}>
          <SelectionDropdown label="Dobavljač *" placeholder="Izaberite dobavljača" icon="ic_document_lines_black" variant="supplier" options={suppliers} selected={supplier}
            onSelected={setSupplier} optionEnabled={item => item.isActive()} disabled={busy || !suppliers.length} maxMenuHeight={220} />
          {supplierError && <span id="delivery-supplier-error" className="delivery-field-error">Obavezno polje.</span>}
        </div>
        <label className="delivery-form-field">Naziv *<input ref={nameRef} aria-label="Naziv" aria-required="true" aria-invalid={!!nameError} aria-describedby={nameError ? 'delivery-name-error' : undefined} onBlur={() => touch('name')} value={name} onChange={event => setName(event.target.value)} disabled={busy} autoCapitalize="sentences" />
          {nameError && <span id="delivery-name-error" className="delivery-field-error">Obavezno polje.</span>}</label>
        <label className="delivery-form-field">Opis (opciono)<textarea aria-label="Opis" value={description} onChange={event => setDescription(event.target.value)} disabled={busy} autoCapitalize="sentences" /></label>
        
      </div>
      <div className="delivery-form-actions"><button type="button" disabled={busy} onClick={onClose}>Otkaži</button>
        <button type="submit" className="delivery-save" disabled={busy}><img src="/assets/drawable/ic_save.svg" alt="" />{busy ? 'Čuvanje...' : 'Sačuvaj'}</button></div>
    </form>
  </section>;
}
function ImagePreview({ image, onClose }) {
  useBackLayer(true, onClose);
  const dialog = useRef(null);
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} className="delivery-image-preview" aria-label="Slika otpremnice" onCancel={event => { event.preventDefault(); onClose(); }}>
    <AuthenticatedImage url={image} />
    <button aria-label="Zatvori" onClick={onClose}><img src="/assets/drawable/ic_close_yellow.svg" alt="" /></button>
  </dialog>;
}
