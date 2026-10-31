import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

let current = null;
let timer;
const listeners = new Set();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => current;
export function showToast(message, duration = 2500) {
  if (!message) return;
  clearTimeout(timer);
  current = { message };
  listeners.forEach(listener => listener());
  timer = setTimeout(() => {
    current = null;
    listeners.forEach(listener => listener());
  }, duration);
}

// Kept at application level so feedback survives screen navigation.
export function ToastHost() {
  const toast = useSyncExternalStore(subscribe, snapshot);
  const element = useRef(null);
  const [target, setTarget] = useState(document.body);
  useLayoutEffect(() => {
    if (!toast) return;
    const node = element.current;
    const position = () => {
      if (node.showPopover) {
        if (node.matches(':popover-open')) node.hidePopover();
        node.showPopover();
      } else {
        // Older Safari: render inside the modal instead of behind its backdrop.
        setTarget([...document.querySelectorAll('dialog[open]')].at(-1) || document.body);
      }
    };
    position();
    const observer = new MutationObserver(position);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, [toast, target]);
  if (!toast) return null;
  return createPortal(<div ref={element} popover="manual" className="app-toast" role="status" aria-live="polite">{toast.message}</div>, target);
}

export default function Toast({ message, onDismiss }) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    if (!message) return;
    showToast(message);
    dismiss.current?.();
  }, [message]);
  return null;
}
