import React, { useState } from 'react';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import { ImagePreview } from './AdminDeliveryNoteDetails.jsx';
import { Title } from './AdminShared.jsx';
import './AdminDeliveryNotesActivity.css';
import './AdminConstructionSiteExpensesActivity.css';
export default function AdminExpenseDetailsActivity({ expense, admin, managerName, onBack }) {
  const [open, setOpen] = useState(false);
  const image = expense.getUrl?.();
  const values = [['Iznos', (expense.getAmount() || '0') + ' RSD'], ['Naziv', expense.getTitle()], ['Gradilište', expense.getConstructionSiteName()], ...(!admin ? [['Šef gradilišta', managerName ?? expense.getManager()?.getFullName()]] : []), ['Datum', expense.getDate()], ['Opis', expense.getDescription()]];
  return <section className="admin-screen admin-delivery-details admin-expense-details"><Title title="TROŠAK" subtitle="Pregled osnovnih podataka o trošku." icon="ic_wallet_black"/>
    {!admin && (image ? <button className="admin-delivery-image" type="button" aria-label="Prikaži račun troška" onClick={() => setOpen(true)}><AuthenticatedImage url={image} alt="Račun troška"/></button> : <div className="admin-delivery-no-image">Trošak nema sliku računa</div>)}
    {values.map(([label,value]) => <div className="admin-delivery-detail-value" key={label}><small>{label}</small><strong>{value?.trim() ? value : '-'}</strong><hr/></div>)}
    <footer><button type="button" onClick={onBack}>Nazad</button></footer>
    {open && <ImagePreview image={image} label="Račun troška" className="admin-expense-preview" onClose={() => setOpen(false)}/>}
  </section>;
}
