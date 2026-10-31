import React, { useEffect, useRef, useState } from 'react';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import { Title, Icon } from './AdminShared.jsx';
import './AdminNoteDetailsActivity.css';

export default function AdminNoteDetailsActivity({ note, siteName }) {
  const [preview, setPreview] = useState(null);
  const [page, setPage] = useState(0);
  // Android passes the five photo slots from the main screen to these details.
  const photos = note.getAttachments().slice(0, 5).map(photo => photo.getUrl()).filter(url => url != null);
  return <section className="admin-screen admin-note-details">
    <Title title="DNEVNI UNOS" subtitle="Detalji izvedenih radova i fotografije." icon="ic_diary"/>
    <div className="admin-note-info">
      <div className="admin-note-info-row">
        <div><small>Gradilište</small><strong>{siteName?.trim() ? siteName : '-'}</strong></div>
        <div><small>Datum</small><strong>{note.getDate() || '-'}</strong></div>
      </div>
      <p>Dnevni unos dodao: <b>{note.getManager()?.trim() ? note.getManager() : '-'}</b></p>
      <div className="admin-note-worker-count"><Icon name="ic_workers_black_no_bg_original_proportions"/><strong>Broj radnika na gradilištu</strong><span>{note.getWorkerCount()}</span></div>
    </div>
    <div className="admin-note-description"><h2>Opis izvedenih radova</h2><p>{note.getNote()?.trim() ? note.getNote() : 'Opis izvedenih radova nije unet.'}</p></div>
    <div className="admin-note-photos">
      {photos.length > 0 && <div className="admin-note-slideshow">
        <PhotoPager photos={photos} auto onPage={setPage} onPhoto={setPreview}/>
        <span className="admin-note-photo-counter">{page + 1} / {photos.length}</span>
      </div>}
      <h2>Fotografije ({photos.length})</h2>
      {photos.length ? <div className="admin-note-thumbnails">{photos.map((url, index) => <button key={index} type="button" aria-label={'Fotografija ' + (index + 1)} className={page === index ? 'current' : ''} onClick={() => setPreview(index)}><AuthenticatedImage url={url} alt={'Fotografija ' + (index + 1)}/></button>)}</div>
        : <div className="admin-note-no-photos">Napomena nema fotografije</div>}
    </div>
    {preview !== null && <FullscreenPhotos photos={photos} initialPage={preview} onClose={() => setPreview(null)}/>}
  </section>;
}

function PhotoPager({ photos, initialPage = 0, auto = false, loop = false, onPage, onPhoto }) {
  const track = useRef(null);
  const current = useRef(initialPage);
  const settle = useRef(null);
  const count = photos.length;
  useEffect(() => {
    const element = track.current;
    const position = () => element.scrollTo({ left: (current.current + (loop ? count : 0)) * element.clientWidth, behavior: 'instant' });
    position();
    const resize = new ResizeObserver(position);
    resize.observe(element);
    const timer = auto && count > 1 ? setInterval(() => {
      element.scrollTo({ left: ((current.current + 1) % count) * element.clientWidth, behavior: 'smooth' });
    }, 2000) : null;
    return () => { resize.disconnect(); clearInterval(timer); clearTimeout(settle.current); };
  }, [count, auto, loop]);
  function scroll() {
    const element = track.current;
    const raw = Math.round(element.scrollLeft / element.clientWidth);
    const index = raw % count;
    current.current = index;
    onPage?.(index);
    clearTimeout(settle.current);
    if (loop) settle.current = setTimeout(() => {
      if (raw < count || raw >= count * 2) element.scrollTo({ left: (count + index) * element.clientWidth, behavior: 'instant' });
    }, 150);
  }
  return <div className="admin-note-photo-pager" ref={track} onScroll={scroll} tabIndex={0} aria-label="Fotografije" onKeyDown={event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      track.current.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * track.current.clientWidth, behavior: 'smooth' });
    }
  }}>{(loop ? [...photos, ...photos, ...photos] : photos).map((url, index) => <div className="admin-note-photo-page" key={index}>
    {onPhoto ? <button type="button" aria-label={'Otvori fotografiju ' + (index + 1)} onClick={() => onPhoto(index)}><AuthenticatedImage url={url} alt={'Fotografija ' + (index % count + 1)}/></button> : <AuthenticatedImage url={url} alt={'Fotografija ' + (index % count + 1)}/>}
  </div>)}</div>;
}

function FullscreenPhotos({ photos, initialPage, onClose }) {
  const dialog = useRef(null);
  const [page, setPage] = useState(initialPage);
  useBackLayer(true, onClose);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.focus({ preventScroll: true });
    return () => element.close();
  }, []);
  return <dialog ref={dialog} tabIndex={-1} className="admin-note-fullscreen" aria-label="Fotografije dnevnog unosa" onCancel={event => { event.preventDefault(); onClose(); }}>
    <PhotoPager photos={photos} initialPage={initialPage} loop onPage={setPage}/>
    <button className="admin-note-close" type="button" aria-label="Zatvori" onClick={onClose}><Icon name="ic_close_yellow"/></button>
    <span className="admin-note-photo-counter">{page + 1} / {photos.length}</span>
  </dialog>;
}
