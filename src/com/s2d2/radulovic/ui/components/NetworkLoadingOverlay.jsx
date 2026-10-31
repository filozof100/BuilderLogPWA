import React, { useEffect, useRef } from 'react';

export default function NetworkLoadingOverlay() {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="network-loading" aria-label="Učitavanje"
    onCancel={event => event.preventDefault()}>
    <div role="status" aria-label="Učitavanje">
      <img src="/assets/drawable/construction_loading_animation.svg" alt="" width="96" height="96" />
    </div>
  </dialog>;
}
