import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import AddDocumentActivity from './AddDocumentActivity.jsx';
import Modal from '../../ui/components/Modal.jsx';
import WebUtils from '../../network/WebUtils.js';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import { Title, Icon, MaterialIcon, Search, Notice, useLoad, mutate } from './AdminShared.jsx';
import './AdminDocumentsActivity.css';

const filters = ['SVI', 'PDF', 'EXCEL', 'DWG'];
function accepts(document, filter) {
  const extension = document.getName().split('.').slice(1).pop()?.toLowerCase() || '';
  const type = (document.getType() || '').toLowerCase();
  if (filter === 'PDF') return extension === 'pdf' || type.includes('pdf');
  if (filter === 'EXCEL') return ['xls', 'xlsx', 'csv'].includes(extension) || type.includes('excel') || type.includes('spreadsheet');
  if (filter === 'DWG') return extension === 'dwg' || type.includes('dwg') || type.includes('acad');
  return true;
}
function documentIcon(document) {
  if (accepts(document, 'PDF')) return 'ic_file_pdf';
  if (accepts(document, 'EXCEL')) return 'ic_file_excel';
  if (accepts(document, 'DWG')) return 'ic_file_dwg';
  return 'ic_document';
}
function timestamp(document) {
  const [day, month, year] = document.getDate().split('.');
  const value = new Date(`${year}-${month}-${day}T${document.getTime()}`).getTime();
  return Number.isNaN(value) ? document.getId() : value;
}
export default function AdminDocumentsActivity({ onBack, initialSite = null, lockSite = false }) {
  const [site, setSite] = useState(initialSite);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('SVI');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [removedIds, setRemovedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false), mounted = useRef(false), urls = useRef(new Set());
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); };
  }, []);
  function remove() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const id = removing.getId();
    mutate('DELETE', 'documents/' + id, {reason:'Admin obrisao'}, {
      onSuccess() { lock.current = false; if (!mounted.current) return; setBusy(false); setRemovedIds(ids => [...ids, id]); setRemoving(null); setNotice('Dokument je obrisan'); },
      onFailure() { lock.current = false; if (!mounted.current) return; setBusy(false); showToast('Brisanje dokumenta nije uspelo'); },
    });
  }
  function preview(item) {
    if (lock.current) return;
    setError(''); setNotice('');
    if (!item.getUrl()?.trim()) { showToast('Dokument nije dostupan'); return; }
    const viewer = window.open('about:blank', '_blank');
    if (viewer) { viewer.opener = null; viewer.document.title = item.getName(); viewer.document.body.textContent = 'Učitavanje dokumenta...'; }
    lock.current = true; setBusy(true);
    const fail = () => { viewer?.close(); lock.current = false; if (mounted.current) { setBusy(false); showToast('Dokument nije moguće otvoriti'); } };
    try {
      const address = new URL(item.getUrl().replace(/^\//, ''), WebUtils.BASE_URL);
      const headers = address.origin === new URL(WebUtils.BASE_URL).origin ? {Authorization:Session.getSessionToken()} : {};
      const name = item.getName().replace(/[\\/:*?"<>|]/g, '_').trim() || 'document_' + item.getId() + '.pdf';
      WebUtils.downloadFile(address.href, name, headers, {
        onSuccess(file) {
          if (!mounted.current) { viewer?.close(); return; }
          try {
            const extension = item.getName().split('.').pop().toLowerCase();
            const types = {pdf:'application/pdf',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv',dwg:'image/vnd.dwg',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',txt:'text/plain',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
            let type = item.getType()?.includes('/') ? item.getType() : types[extension] || 'application/pdf';
            if (['text/html','application/xhtml+xml','image/svg+xml','application/xml','text/xml'].includes(type.toLowerCase().split(';')[0])) type = 'text/plain';
            const url = URL.createObjectURL(new File([file], file.name, {type}));
            urls.current.add(url);
            if (viewer && !viewer.closed) viewer.location.replace(url);
            else { URL.revokeObjectURL(url); urls.current.delete(url); showToast('Nema aplikacije za prikaz ovog dokumenta'); }
            lock.current = false; setBusy(false);
          } catch { fail(); }
        }, onFailure:fail,
      });
    } catch { fail(); }
  }

  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const documents = useLoad(cb => {
    if (!site) { cb.onSuccess([]); return; }
    Session.getAllDocumentsFromServer(site, cb);
  }, [site], []);
  const visible = documents.data.filter(document => !removedIds.includes(document.getId()) && document.getName().toLocaleLowerCase().includes(search.toLocaleLowerCase()) && accepts(document, filter))
    .sort((a, b) => timestamp(b) - timestamp(a) || a.getName().toLocaleLowerCase().localeCompare(b.getName().toLocaleLowerCase()));
  if (adding || editing) return <AddDocumentActivity initialSite={site} lockSite={lockSite} document={editing} onBack={() => { setAdding(false); setEditing(null); }} onSaved={savedSite => { if (!lockSite) setSite(savedSite); setAdding(false); setEditing(null); setNotice(editing?'Dokument je izmenjen':'Dokument je dodat'); documents.reload(); }}/>;
  return <section className="admin-screen admin-documents" data-filter={filter}>
    <Title title="DOKUMENTI" subtitle="Pregled i upravljanje dokumentima." icon="ic_folder_simple_black" onBack={onBack}/>
    <div className="admin-documents-sites"><SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={sites.data} selected={site} disabled={busy || lockSite} onSelected={value => { setSite(value); setError(''); setNotice(''); }}/></div>
    
    <Search value={search} onChange={setSearch} placeholder="Pretraži dokumente..."/>
    <div className="admin-document-filters" role="tablist" aria-label="Tip dokumenta">{filters.map(value => <button type="button" key={value} role="tab" aria-selected={value === filter} onClick={() => setFilter(value)}>{value}</button>)}</div>
    <button type="button" className="admin-document-add" disabled={busy} onClick={() => { setError(''); if (!site) { showToast('Izaberite gradilište'); return; } setAdding(true); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>Dodaj dokument</button>
    {error && !removing && <p className="error-message" role="alert">{error}</p>}
    <Toast message={notice} onDismiss={() => setNotice('')}/>
    {documents.loading ? <Notice>Učitavanje dokumenata...</Notice>
      : documents.error ? null
      : !visible.length ? <Notice>Nema dokumenata za izabrano gradilište.</Notice>
      : <div className="admin-document-list">{visible.map(document => <article className="admin-document-row" key={document.getId()}>
        <header><Icon name={documentIcon(document)}/><div><strong>{document.getName()}</strong><small>{`${document.getDate()} ${document.getTime()}`.trim()}</small></div></header>
        <div className="admin-document-actions">
          <button type="button" disabled={busy} onClick={() => preview(document)}><Icon name="ic_document_view"/>Prikaži</button>
          <button type="button" disabled={busy} onClick={() => { setError(''); setNotice(''); setEditing(document); }}><MaterialIcon name="edit" size={20}/>Izmeni</button>
          <button type="button" disabled={busy} className="destructive" onClick={() => { setError(''); setNotice(''); setRemoving(document); }}><Icon name="ic_costs_trash"/>Obriši</button>
        </div>
      </article>)}</div>}
    {removing && <Modal className="admin-document-delete" title="Obriši dokument?" busy={busy} onClose={() => { setRemoving(null); setError(''); }} actions={<>
      <button type="button" disabled={busy} onClick={() => { setRemoving(null); setError(''); }}>Otkaži</button>
      <button type="button" className="admin-document-delete-confirm" disabled={busy} onClick={remove}>{busy?'BRISANJE...':'OBRIŠI'}</button>
    </>}><strong>{removing.getName()}</strong><p>Dokument će biti trajno uklonjen.</p>{error && <p className="error-message" role="alert">{error}</p>}</Modal>}
  </section>;
}
