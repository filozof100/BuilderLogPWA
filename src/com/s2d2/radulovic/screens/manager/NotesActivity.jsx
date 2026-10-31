import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import StandardSiteDateControls from '../../ui/components/StandardSiteDateControls.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import './DeliveryNotesActivity.css';
import './NotesActivity.css';

const icon = name => '/assets/drawable/' + name + '.svg';
const emptyPhotos = () => Array(5).fill(null);
// Browsers decode camera orientation before drawing the image to the canvas.
async function compressPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .8));
    if (!blob) return file;
    return new File([blob], 'note.jpg', { type: 'image/jpeg' });
  } catch { return file; }
  finally { URL.revokeObjectURL(url); }
}
export default function NotesActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [date, setDate] = useState(() => TimeUtils.formatDate(new Date()));
  const [sites, setSites] = useState([]), [log, setLog] = useState(null), [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [processing, setProcessing] = useState(false);
  const [error, setError] = useState(''), [sitesError, setSitesError] = useState(''), [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null), [preview, setPreview] = useState(null);
  useBackLayer(!!editor, () => { setEditor(null); setError(''); }, busy || processing);
  const camera = useRef(null), pendingIndex = useRef(0), urls = useRef([]), lock = useRef(false), mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; urls.current.forEach(url => URL.revokeObjectURL(url)); }; }, []);
  useEffect(() => {
    let active = true; setSitesError('');
    Session.getAssignedSitesFromServer({
      onSuccess(items) { if (active) setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]); },
      onFailure() { if (active) setSitesError('Učitavanje gradilišta nije uspelo.'); },
    });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true; setLog(null); setNotes([]); setError(''); setLoading(!!site);
    const fail = () => { if (active) { setLoading(false); setError('Učitavanje dnevnih unosa nije uspelo.'); } };
    if (site) DailyLogUtils.createOrUpdateDailyLog(site, date, {
      onSuccess(dailyLog) {
        if (!active) return;
        setLog(dailyLog);
        Session.getAllNotesFromServer(dailyLog, {
          onSuccess(items) {
            if (!active) return;
            setNotes(items.map(item => ({ id: item.getId(), text: item.getNote(), date: item.getDate(), site: site.getName(), dailyLog: item.getDailyLog(), workerCount: item.getWorkerCount(),
              photos: Array.from({ length: 5 }, (_, index) => { const photo = item.getAttachments()[index]; return photo ? { id: photo.getId(), url: photo.getUrl() } : null; }) })));
            setLoading(false);
          }, onFailure: fail,
        });
      }, onFailure: fail,
    });
    return () => { active = false; };
  }, [site, date, retry]);
  function capture(index) { pendingIndex.current = index; camera.current.click(); }
  async function selected(event) {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    const index = pendingIndex.current; setProcessing(true);
    const optimized = await compressPhoto(file);
    if (!mounted.current) return;
    const url = URL.createObjectURL(optimized); urls.current.push(url);
    setEditor(previous => previous && ({ ...previous, photos: previous.photos.map((photo, i) => i === index ? { file: optimized, url } : photo) }));
    setProcessing(false);
  }
  function save() {
    if (!editor.id && !(Number(editor.workers) > 0)) { showToast('Broj radnika je obavezan.'); return; }
    if (!editor.text.trim()) { showToast('Opis izvedenih radova je obavezan.'); return; }
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const fail = () => { lock.current = false; setBusy(false); setError('Čuvanje dnevnog unosa nije uspelo.'); };
    try {
      const body = new FormData(); body.append('note', editor.text.trim()); body.append('notify_admin', editor.id ? '0' : '1');
      if (editor.id) {
        body.append('worker_count', String(editor.workerCount));
        body.append('reason', 'korisnicka izmena');
        const retained = new Set(editor.photos.filter(Boolean).map(photo => photo.id));
        editor.originalPhotos.filter(photo => photo?.id != null && !retained.has(photo.id)).forEach(photo => body.append('delete_attachments[]', String(photo.id)));
      } else body.append('worker_count', String(Number(editor.workers)));
      editor.photos.filter(photo => photo?.file).forEach((photo, index) => body.append('attachments[]', photo.file, 'note_' + (index + 1) + '.' + (photo.file.type === 'image/jpeg' ? 'jpg' : photo.file.name.split('.').pop())));
      const dailyLog = editor.id ? editor.dailyLog : log;
      const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/notes';
      const callback = {
        onSuccess(response) {
          if (editor.id) {
            let photos = editor.photos;
            try {
              const data = JSON.parse(response).data;
              if (Object.hasOwn(data, 'attachments')) photos = Array.from({ length: 5 }, (_, index) => { const photo = data.attachments?.[index]; return photo ? { id: photo.id, url: photo.download_url } : null; });
            } catch { /* Android keeps the edited photos when the response omits them. */ }
            setNotes(previous => previous.map(note => note.id === editor.id ? { ...note, text: editor.text.trim(), photos } : note));
          } else setRetry(value => value + 1);
          setEditor(null); lock.current = false; setBusy(false);
        }, onFailure: fail,
      };
      if (editor.id) WebUtils.sendPATCHRequest(endpoint + '/' + editor.id, body, { Authorization: Session.getSessionToken() }, callback);
      else WebUtils.sendPOSTRequest(endpoint, body, { Authorization: Session.getSessionToken() }, callback);
    } catch { fail(); }
  }
  const controls = <StandardSiteDateControls sites={sites} site={site} onSiteSelected={setSite} date={date} onDateSelected={setDate} disabled={busy || processing || loading} />;
  const loadError = (sitesError || (!editor && error)) && null;
  return <>
    {editor ? <NoteForm editor={editor} setEditor={setEditor} controls={controls} busy={busy || processing} canSave={!!(editor.id || log) && !loading} error={error} setupError={loadError}
      onRetry={() => setRetry(value => value + 1)} onSave={save} onClose={() => { setEditor(null); setError(''); }} onCapture={capture} onPreview={index => setPreview({ photos: editor.photos.filter(Boolean), index: editor.photos.slice(0, index).filter(Boolean).length })} /> :
      <section className="manager-notes"><NoteTitle title="GRAĐEVINSKI DNEVNIK" subtitle="Dnevni pregled izvedenih radova na gradilištu." onBack={onBack} list />
        {controls}{loadError}<button className="note-new" disabled={!site || loading} onClick={() => { setError(''); setEditor({ workers: '', text: '', photos: emptyPhotos() }); }}><img src={icon('ic_costs_camera')} alt="" />Novi dnevni unos</button>
        <h2>Dnevni unosi</h2><div className="note-list">{!notes.length ? <p className="note-empty">Nema dnevnih unosa za izabrani datum.</p> : notes.map(note =>
          <button className="note-card" key={note.id} onClick={() => { setError(''); setEditor({ ...note, originalPhotos: note.photos, photos: [...note.photos] }); }}>
            <span className="note-card-text"><small>{note.date}</small><span>{note.text}</span><small>Broj fotografija: {note.photos.filter(Boolean).length}</small></span>
            <span className="note-thumb">{note.photos.find(Boolean) ? <Photo photo={note.photos.find(Boolean)} /> : <img className="note-placeholder" src={icon('ic_diary')} alt="" />}</span>
          </button>)}</div>
      </section>}
    <input ref={camera} hidden type="file" accept="image/*" capture="environment" aria-label="Fotografija dnevnog unosa" onChange={selected} />
    {preview && <PhotoPager photos={preview.photos} initialIndex={preview.index} onClose={() => setPreview(null)} />}
  </>;
}
function NoteTitle({ title, subtitle, onBack, busy, list }) {
  return <header className="delivery-title"><span><img src={icon(list ? 'ic_document_lines_black' : 'ic_diary')} alt="" /></span><div><h1>{title}</h1><p>{subtitle}</p></div></header>;
}
function Photo({ photo }) { return <AuthenticatedImage url={photo.url} alt="Fotografija dnevnog unosa" />; }
function NoteForm({ editor, setEditor, controls, busy, canSave, error, setupError, onRetry, onSave, onClose, onCapture, onPreview }) {
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const touch = key => setTouched(previous => ({ ...previous, [key]: true }));
  const workerRef = useRef(null), textRef = useRef(null);
  const invalidWorkers = !editor.id && !(Number(editor.workers) > 0), invalidText = !editor.text.trim() || editor.text === '-';
  const workerError = (submitted || touched.workers) && invalidWorkers
    ? (!editor.workers.trim() || editor.workers === '-' ? 'Obavezno polje.' : 'Unesite broj radnika veći od 0.') : '';
  const textError = (submitted || touched.text) && invalidText ? 'Obavezno polje.' : '';
  function submit(event) {
    event.preventDefault();
    if (busy || !canSave) return;
    setSubmitted(true);
    const control = invalidWorkers ? workerRef.current : invalidText ? textRef.current : null;
    if (control) {
      requestAnimationFrame(() => {
        control.focus({ preventScroll: true });
        control.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    setSubmitted(false); setTouched({});
    onSave();
  }
  function change(field, value) { setEditor(previous => ({ ...previous, [field]: value })); }
  function removePhoto(index) {
    setEditor(previous => {
      const photos = previous.photos.map((photo, i) => i === index ? null : photo);
      return { ...previous, photos };
    });
  }
  return <section className={'note-form ' + (editor.id ? 'note-edit' : 'note-add')}>
    <NoteTitle title={editor.id ? 'UREDI DNEVNI UNOS' : 'NOVI DNEVNI UNOS'} subtitle={editor.id ? 'Izmena opisa radova i fotografija.' : 'Evidencija radnika i izvedenih radova.'} onBack={onClose} busy={busy} />
    {editor.id ? <div className="note-readonly"><div><small>Gradilište</small><strong>{editor.site}</strong></div><div><small>Datum</small><strong>{editor.date}</strong></div></div> : <>{controls}{setupError}
      <div className="note-validated-field"><label className="note-field-card">Broj radnika na gradilištu *<input ref={workerRef} aria-label="Broj radnika" inputMode="numeric" placeholder="Unesite broj radnika" value={editor.workers} disabled={busy} onChange={event => change('workers', event.target.value.replace(/\D/g, '').slice(0, 4))} aria-required="true" aria-invalid={!!workerError} aria-describedby={workerError ? 'note-workers-error' : undefined} onBlur={() => touch('workers')} />
      </label>{workerError && <span id="note-workers-error" className="note-field-error">{workerError}</span>}</div></>}
    <div className="note-validated-field"><label className="note-field-card">Opis izvedenih radova *<span className="note-text-box"><textarea ref={textRef} aria-label="Opis izvedenih radova" placeholder="Unesite opis izvedenih radova..." value={editor.text} maxLength={1000} disabled={busy} onChange={event => change('text', event.target.value.slice(0, 1000))} aria-required="true" aria-invalid={!!textError} aria-describedby={textError ? 'note-text-error' : undefined} onBlur={() => touch('text')} autoCapitalize="sentences" /><small>{editor.text.length}/1000</small></span>
    </label>{textError && <span id="note-text-error" className="note-field-error">{textError}</span>}</div>
    {editor.id ? <div className="note-edit-photos"><h2>Fotografije ({editor.photos.filter(Boolean).length}/5)</h2><div className="note-photo-strip">
      {editor.photos.map((photo, index) => photo && <div key={index}><button type="button" aria-label={'Prikaži fotografiju ' + (index + 1)} disabled={busy} onClick={() => onPreview(index)}><Photo photo={photo} /></button>
        <button type="button" className="note-remove-photo" aria-label={'Ukloni fotografiju ' + (index + 1)} disabled={busy} onClick={() => removePhoto(index)}>×</button></div>)}
      </div><button type="button" className="note-add-photo" disabled={busy} onClick={() => { const index = editor.photos.indexOf(null); onCapture(index < 0 ? 4 : index); }}><img src={icon('ic_costs_camera')} alt="" />Dodaj fotografije</button></div> :
      <div className="note-field-card"><strong>Fotografije (opciono) ({editor.photos.filter(Boolean).length}/5)</strong><div className="note-photo-slots">{editor.photos.map((photo, index) => <button key={index} type="button" disabled={busy} aria-label={'Dodaj fotografiju ' + (index + 1)} onClick={() => onCapture(index)}>{photo ? <Photo photo={photo} /> : index === 0 ? <><img src={icon('ic_costs_camera')} alt="" /><span>Dodaj</span></> : '+'}</button>)}</div></div>}
    
    <div className="delivery-form-actions"><button type="button" disabled={busy} onClick={onClose}>Otkaži</button><button type="button" onClick={submit} className="delivery-save" disabled={busy || !canSave}><img src={icon('ic_save')} alt="" />{busy ? 'Obrada...' : 'Sačuvaj'}</button></div>
  </section>;
}
function PhotoPager({ photos, initialIndex, onClose }) {
  useBackLayer(true, onClose);
  const [index, setIndex] = useState(initialIndex);
  const dialog = useRef(null), track = useRef(null), current = useRef(initialIndex);
  useLayoutEffect(() => {
    const element = dialog.current;
    const strip = track.current;
    element.showModal();
    const position = () => strip.scrollTo({ left: current.current * strip.clientWidth, behavior: 'instant' });
    position();
    const resize = new ResizeObserver(position);
    resize.observe(strip);
    return () => { resize.disconnect(); element.close(); };
  }, []);
  function scroll() {
    const strip = track.current;
    if (!strip.clientWidth) return;
    const page = Math.max(0, Math.min(photos.length - 1, Math.round(strip.scrollLeft / strip.clientWidth)));
    current.current = page;
    setIndex(page);
  }
  function shift(amount) {
    const page = Math.max(0, Math.min(photos.length - 1, current.current + amount));
    track.current.scrollTo({ left: page * track.current.clientWidth, behavior: 'smooth' });
  }
  return <dialog ref={dialog} className="note-photo-pager" aria-label="Fotografije dnevnog unosa" onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        shift(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
    <div ref={track} className="note-photo-pages" onScroll={scroll} onDragStart={event => event.preventDefault()}>
      {photos.map((photo, page) => <div className="note-photo-page" key={page}><Photo photo={photo} /></div>)}
    </div>
    <button className="note-preview-close" aria-label="Zatvori" onClick={onClose}><img src={icon('ic_close_yellow')} alt="" /></button>
    <span className="note-photo-count">{index + 1} / {photos.length}</span>
  </dialog>;
}
