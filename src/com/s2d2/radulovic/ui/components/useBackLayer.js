import { useEffect, useRef } from 'react';

const layers = [];
const session = Math.random().toString(36).slice(2);
let installed = false;
let synchronizing = false;
let scheduled = false;
const current = () => history.state?.radulovicNavigation;
function write(depth) {
  return { ...history.state, radulovicNavigation: { session, depth } };
}
function synchronize() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    const state = current();
    const depth = layers.at(-1)?.depth ?? 0;
    if (!synchronizing && state?.session === session && state.depth > depth) {
      synchronizing = true;
      history.go(depth - state.depth);
    }
  });
}
function install() {
  if (installed) return;
  installed = true;
  history.replaceState(write(0), '');
  window.addEventListener('popstate', () => {
    synchronizing = false;
    const state = current();
    const depth = state?.session === session ? state.depth : 0;
    const closing = layers.filter(layer => layer.depth > depth);
    if (closing.some(layer => layer.blocked())) {
      history.go((layers.at(-1)?.depth ?? 0) - depth);
      return;
    }
    for (const layer of closing.reverse()) {
      layers.splice(layers.indexOf(layer), 1);
      layer.close();
    }
  });
}

// One history entry per screen, form, dropdown, or dialog; React state remains its owner.
export default function useBackLayer(active, onBack, busy = false) {
  const latest = useRef({ onBack, busy });
  latest.current = { onBack, busy };
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let layer;
    // StrictMode's probe mount must not create a second history entry.
    function register() {
      if (disposed) return;
      if (synchronizing) { setTimeout(register, 10); return; }
      install();
      const depth = (layers.at(-1)?.depth ?? 0) + 1;
      layer = { depth, close: () => latest.current.onBack(), blocked: () => latest.current.busy };
      layers.push(layer);
      // Replacing a dismissed dialog with a form keeps the same history slot.
      if (current()?.session === session && current().depth === depth) {
        history.replaceState(write(depth), '');
      } else {
        history.pushState(write(depth), '');
      }
    }
    queueMicrotask(register);
    return () => {
      disposed = true;
      const index = layers.indexOf(layer);
      if (index >= 0) { layers.splice(index, 1); synchronize(); }
    };
  }, [!!active]);
}
