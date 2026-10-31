import useBackLayer from './useBackLayer.js';
import React, { useEffect, useRef } from 'react';

export default function Modal({ title, children, actions, onClose, busy = false, className = '' }) {
  useBackLayer(true, onClose, busy);
  const dialog = useRef(null);
  const titleId = React.useId();
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} className={'app-dialog ' + className} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="app-dialog-content">
        <h2 id={titleId}>{title}</h2>
        <div className="app-dialog-body" inert={busy}>{children}</div>
        <div className="app-dialog-actions">{actions}</div>
      </div>
    </dialog>
  );
}
