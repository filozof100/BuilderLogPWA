import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import './DocumentsActivity.css';

const mimeTypes = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', txt: 'text/plain', csv: 'text/csv',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};
function documentMimeType(item) {
  if (item.getType().includes('/')) return item.getType();
  const extension = item.getName().includes('.') ? item.getName().split('.').pop().toLowerCase() : item.getType().toLowerCase();
  return mimeTypes[extension] || 'application/pdf';
}
function documentFilename(item) {
  return item.getName().replace(/[\\/:*?"<>|]/g, '_').trim() || 'document_' + item.getId() + '.pdf';
}

export default function DocumentsActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [sites, setSites] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sitesError, setSitesError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [siteRetry, setSiteRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(false);
  const urls = useRef(new Set());
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); };
  }, []);
  useEffect(() => {
    let active = true;
    setSitesError('');
    Session.getAllSitesFromServer({
      onSuccess(items) {
        if (!active) return;
        setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]);
      },
      onFailure() { if (active) setSitesError('Učitavanje gradilišta nije uspelo.'); },
    });
    return () => { active = false; };
  }, [siteRetry]);
  useEffect(() => {
    let active = true;
    setDocuments([]); setError(''); setNotice('');
    if (!site) { setLoading(false); return () => { active = false; }; }
    setLoading(true);
    Session.getAllDocumentsFromServer(site.getId(), {
      onSuccess(items) { if (active) { setDocuments(items); setLoading(false); } },
      onFailure() { if (active) { setError('Učitavanje dokumenata nije uspelo.'); setLoading(false); } },
    });
    return () => { active = false; };
  }, [site, retry]);

  function release(url) { URL.revokeObjectURL(url); urls.current.delete(url); }
  function download(url, name) {
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove();
    showToast('Preuzimanje dokumenta je pokrenuto');
  }
  function open(item, action) {
    setError(''); setNotice('');
    if (!item.getUrl()?.trim()) { showToast('Dokument nije dostupan'); return; }
    if (lock.current) return;
    // Open during the tap: opening after the download is blocked on mobile browsers.
    const viewer = action === 'preview' ? window.open('about:blank', '_blank') : null;
    if (viewer) {
      viewer.opener = null;
      viewer.document.title = item.getName();
      viewer.document.body.textContent = 'Učitavanje dokumenta...';
    }
    lock.current = true; setBusy(true);
    const fail = () => {
      viewer?.close();
      window.focus();
      lock.current = false;
      if (mounted.current) { setBusy(false); showToast(action === 'preview' ? 'Dokument nije moguće otvoriti' : 'Preuzimanje nije moguće pokrenuti'); }
    };
    try {
      const address = new URL(item.getUrl().replace(/^\//, ''), WebUtils.BASE_URL);
      const headers = address.origin === new URL(WebUtils.BASE_URL).origin ? { Authorization: Session.getSessionToken() } : {};
      WebUtils.downloadFile(address.href, documentFilename(item), headers, {
        onSuccess(file) {
          if (!mounted.current) { viewer?.close(); return; }
          try {
            const type = documentMimeType(item);
            // Active document formats must not execute scripts on the app's origin.
            const previewType = ['text/html', 'application/xhtml+xml', 'image/svg+xml', 'application/xml', 'text/xml'].includes(type.toLowerCase().split(';')[0]) ? 'text/plain' : type;
            const typedFile = new File([file], file.name, { type: action === 'preview' ? previewType : 'application/octet-stream' });
            const url = URL.createObjectURL(typedFile);
            urls.current.add(url);
            if (action === 'preview') {
              if (viewer && !viewer.closed) {
                viewer.document.body.textContent = 'Otvaranje dokumenta: ' + file.name + '. Ako pregledač ne podržava ovaj format, dokument će biti preuzet.';
                viewer.location.replace(url);
              }
              else { URL.revokeObjectURL(url); urls.current.delete(url); showToast('Nema aplikacije za prikaz ovog dokumenta'); }
            }
            else { download(url, file.name); setTimeout(() => release(url), 60000); }
            lock.current = false; setBusy(false);
          } catch { fail(); }
        },
        onFailure: fail,
      });
    } catch { fail(); }
  }

  const filtered = documents.filter(item => item.getName().toLowerCase().includes(search.toLowerCase()));
  return <section className="manager-documents">
    <header className="documents-title">
      <span><img src="/assets/drawable/ic_folder_simple_black.svg" alt="" /></span><div><h1>DOKUMENTI</h1><p>Sva dokumenta koja je admin ubacio.</p></div></header>
    <div className="documents-site-card manager-site-picker">
      <SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane"
        options={sites} selected={site} onSelected={setSite} optionEnabled={item => item.canSelect()} disabled={busy} maxMenuHeight={180} />
      
    </div>
    <label className="documents-search"><img src="/assets/drawable/ic_search.svg" alt="" /><input aria-label="Pretraži dokumente" placeholder="Pretraži dokumente..." value={search} onChange={event => setSearch(event.target.value)} /></label>
    
    <Toast message={notice} onDismiss={() => setNotice('')}/>
    {loading || !filtered.length ? <p className="documents-notice">{loading ? 'Učitavanje dokumenata...' : 'Nema dostupnih dokumenata.'}</p> :
      <div className="documents-list">{filtered.map(item => <article className="document-card" key={item.getId()}>
        <div className="document-heading"><img src="/assets/drawable/ic_file_pdf.svg" alt="" /><h2>{item.getName()}</h2></div>
        <p>{item.getDate()} {item.getTime()}</p>
        <div className="document-actions"><button disabled={busy} onClick={() => open(item, 'preview')}><img src="/assets/drawable/ic_document_view.svg" alt="" />Prikaži</button>
          <button disabled={busy} onClick={() => open(item, 'download')}><img src="/assets/drawable/ic_document_download.svg" alt="" />Preuzmi</button></div>
      </article>)}</div>}
  </section>;
}
