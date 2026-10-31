import React, { useEffect, useRef, useState } from 'react';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import { Title, Icon } from './AdminShared.jsx';

export default function AdminDeliveryNoteDetails({ note, onBack }) {
  const [imageOpen, setImageOpen] = useState(false);
  const image = note.getUrl()?.trim();
  const date = note.getDate();
  const values = [
    ['Naziv', note.getName()],
    ['Opis', note.getDescription()],
    ['Datum', /^\d{4}-\d{2}-\d{2}/.test(date) ? dateLabel(date.slice(0, 10)) : date],
    ['Dodao', note.getManagerName()],
    ['Dobavljač', note.getSupplierName()],
  ];
  return <section className="admin-screen admin-delivery-details">
    <Title title="OTPREMNICA" subtitle="Pregled otpremnice i osnovnih podataka." icon="ic_document_lines_black" onBack={onBack}/>
    {image ? <button type="button" className="admin-delivery-image" aria-label="Prikaži sliku otpremnice" onClick={() => setImageOpen(true)}>
      <AuthenticatedImage url={image}/>
    </button> : <div className="admin-delivery-no-image">Otpremnica nema sliku</div>}
    {values.map(([label, value]) => <div className="admin-delivery-detail-value" key={label}>
      <small>{label}</small><strong>{value?.trim() ? value : '-'}</strong><hr/>
    </div>)}
    <footer><button type="button" onClick={onBack}>Nazad</button></footer>
    {imageOpen && <ImagePreview image={image} onClose={() => setImageOpen(false)}/>}
  </section>;
}
export function ImagePreview({ image, onClose, label = 'Slika otpremnice', className = '' }) {
  useBackLayer(true, onClose);
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.focus({ preventScroll: true });
    return () => element.close();
  }, []);
  return <dialog ref={dialog} tabIndex={-1} className={'admin-delivery-image-preview ' + className} aria-label={label}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <AuthenticatedImage url={image}/>
    <button type="button" aria-label="Zatvori" onClick={onClose}><Icon name="ic_close_yellow"/></button>
  </dialog>;
}
