import { showToast } from '../../ui/components/Toast.jsx';
import React, { useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import { Title, Icon, Notice, useLoad } from './AdminShared.jsx';
import './AddDocumentActivity.css';

const types = [
  { label:'PDF', value:'pdf', icon:'ic_file_pdf', extensions:'PDF (.pdf)', accept:'.pdf,application/pdf' },
  { label:'Excel', value:'excel', icon:'ic_file_excel', extensions:'Excel (.xls, .xlsx)', accept:'.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { label:'AutoCAD', value:'dwg', icon:'ic_file_dwg', extensions:'AutoCAD (.dwg)', accept:'.dwg,application/acad,application/dwg,image/vnd.dwg' },
];
const capitalize = value => value.replace(/\p{L}/u, letter => letter.toLocaleUpperCase());
const sizeLabel = file => file.size >= 1024*1024 ? (file.size/(1024*1024)).toFixed(1)+' MB' : (file.size/1024).toFixed(0)+' KB';
function initialType(document) {
  const value = ((document?.getType() || '') + ' ' + (document?.getName().split('.').pop() || '')).toLowerCase();
  return value.includes('dwg') || value.includes('acad') ? types[2] : /excel|spreadsheet|xlsx|xls/.test(value) ? types[1] : types[0];
}
export default function AddDocumentActivity({ initialSite, lockSite = false, document, onBack, onSaved }) {
  const editing = !!document;
  const existingFileName = document?.getName() || '';
  const [site, setSite] = useState(initialSite);
  const [type, setType] = useState(() => initialType(document));
  const [name, setName] = useState(document?.getName() || '');
  const [description, setDescription] = useState(document?.getDescription() || '');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const picker = useRef(null), lock = useRef(false);
  const siteField = useRef(null), nameInput = useRef(null), fileButton = useRef(null);
  const invalid = documentValidation(site, name, file, editing);
  const showError = key => invalid[key] && (submitted || touched[key]);
  const touch = key => setTouched(previous => ({ ...previous, [key]: true }));
  const fieldError = key => showError(key) && <span className="document-field-error" id={'document-error-' + key}>Obavezno polje.</span>;
  useBackLayer(true, onBack, busy);
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  async function chooseFile(event) {
    touch('file');
    const selected = event.target.files[0];
    event.target.value = '';
    if (!selected) return;
    if (selected.size > 25*1024*1024) { showToast('Maksimalna veličina fajla je 25 MB'); return; }
    try { await selected.slice(0, 1).arrayBuffer(); } catch { showToast('Fajl nije moguće otvoriti'); return; }
    setFile(selected); setName(selected.name); setError('');
  }
  function save(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true); setError('');
    const firstInvalid = ['site', 'name', 'file'].find(key => invalid[key]);
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const control = firstInvalid === 'site' ? siteField.current?.querySelector('.selection-field')
          : firstInvalid === 'name' ? nameInput.current : fileButton.current;
        control?.focus({ preventScroll: true });
        control?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    const body = new FormData();
    body.append('construction_site_id', String(site.getId()));
    body.append('type', type.value);
    // Android's create request sends the original file, without name/description fields.
    if (editing) { body.append('name', name.trim()); body.append('description', description.trim()); }
    if (file) body.append('files[]', file, file.name);
    setSubmitted(false); setTouched({});
    lock.current = true; setBusy(true);
    WebUtils[editing ? 'sendPATCHRequest' : 'sendPOSTRequest'](editing ? 'documents/' + document.getId() : 'documents', body, {Authorization:Session.getSessionToken()}, {
      onSuccess() { lock.current = false; setBusy(false); onSaved(site); },
      onFailure() { lock.current = false; setBusy(false); showToast(editing ? 'Izmena dokumenta nije uspela' : 'Dodavanje dokumenta nije uspelo'); },
    });
  }
  return <section className="admin-screen admin-add-document">
    <Title title={editing?"Izmenite dokument":"Dodaj  dokument"} subtitle={editing?"Izmenite podatke ili zamenite fajl.":"Dodaj novi dokument."} icon="ic_folder_simple_black"/>
    <form onSubmit={save} noValidate>
      <fieldset disabled={busy}>
        <div ref={siteField} className="admin-documents-sites admin-add-document-site" role="group" aria-label="Gradilište" aria-invalid={!!showError('site')} aria-describedby={showError('site') ? 'document-error-site' : undefined}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) touch('site'); }}>
          <SelectionDropdown label={lockSite ? "Gradilište" : "Gradilište *"} placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={sites.data} selected={site} onSelected={setSite} disabled={busy || lockSite}/>
          {fieldError('site')}
        </div>
        
        <div className="admin-document-type-field"><strong>Tip dokumenta</strong><div className="admin-document-types">{types.map(item => <button type="button" key={item.value} aria-pressed={type===item} onClick={() => { if(type!==item){setType(item);setFile(null);} }}><Icon name={item.icon}/><span>{item.label}</span></button>)}</div></div>
        <label className="admin-document-input">Naziv dokumenta *<input ref={nameInput} aria-label="Naziv dokumenta *" aria-required="true" placeholder="Unesite naziv dokumenta" value={name} aria-invalid={!!showError('name')} aria-describedby={showError('name') ? 'document-error-name' : undefined} onBlur={() => touch('name')} onChange={event => setName(capitalize(event.target.value))}/>{fieldError('name')}</label>
        <label className="admin-document-input">Opis dokumenta (opciono)<span className="admin-document-description"><textarea aria-label="Opis dokumenta" placeholder="Unesite opis dokumenta" maxLength={300} value={description} onChange={event => setDescription(capitalize(event.target.value.slice(0,300)))}/><small>{description.length}/300</small></span></label>
        <div className="admin-document-file-field"><strong>{editing?"Zamenite fajl (opciono)":"Izaberite fajl *"}</strong>
          <input ref={picker} type="file" accept={type.accept} onChange={chooseFile} onCancel={() => touch('file')} hidden/>
          <button ref={fileButton} type="button" className="admin-document-file" aria-label="Izaberite fajl" aria-required={!editing} aria-invalid={!!showError('file')} aria-describedby={showError('file') ? 'document-error-file' : undefined} onBlur={() => touch('file')} onClick={() => picker.current.click()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11C20.78 12.14 22 13.44 22 15c0 1.65-1.35 3-3 3zM8 13h3v4h2v-4h3l-4-4-4 4z"/></svg>
            <strong>{file?file.name:existingFileName||'Pritisnite za izbor fajla'}</strong><small>{file?sizeLabel(file):existingFileName?'Pritisnite za izbor novog fajla':type.extensions}</small>
          </button>
          {fieldError('file')}
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" className="admin-document-save"><Icon name="ic_upload"/>{busy?'Čuvanje...':editing?'Sačuvaj izmene':'Sačuvaj dokument'}</button>
      </fieldset>
    </form>
  </section>;
}


function documentValidation(site, name, file, editing) {
  return { site: !site, name: !name.trim() || name === '-', file: !editing && !file };
}
