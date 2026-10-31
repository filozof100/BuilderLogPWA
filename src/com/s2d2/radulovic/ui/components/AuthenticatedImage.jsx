import React, { useEffect, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';

export default function AuthenticatedImage({ url, className = '', alt = 'Slika otpremnice' }) {
  const [source, setSource] = useState(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setSource(null); setFailed(false);
    if (!url) return;
    if (url.startsWith('blob:')) { setSource(url); return; }
    const controller = new AbortController();
    let objectUrl;
    (async () => {
      try {
        const address = new URL(url, WebUtils.BASE_URL);
        const headers = address.origin === new URL(WebUtils.BASE_URL).origin ? { Authorization: Session.getSessionToken() } : {};
        const response = await fetch(address, { headers, signal: controller.signal });
        if (!response.ok) throw new Error('Image download failed');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      } catch { if (!controller.signal.aborted) setFailed(true); }
    })();
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, retry]);
  if (failed) return null;
  return <img className={className + (!source ? ' image-placeholder' : '')} src={source || '/assets/drawable/' + (url ? 'ic_file_image' : 'ic_document_lines_black') + '.svg'} alt={alt} onError={() => { if (source) setFailed(true); }} />;
}
