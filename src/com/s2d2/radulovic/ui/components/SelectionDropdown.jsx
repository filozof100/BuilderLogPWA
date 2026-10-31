import useBackLayer from './useBackLayer.js';
import React, { useEffect, useId, useRef, useState } from 'react';

export default function SelectionDropdown({ label, placeholder, icon, options, selected, onSelected, optionEnabled, disabled = false, emptyText, maxMenuHeight = 240, showChevronWhenDisabled = false, variant = icon === 'ic_construction_site_crane' ? 'site' : 'default' }) {
  const [open, setOpen] = useState(false);
  const enabledOption = optionEnabled ?? (option => variant !== 'site' || option.isAllSites || option.canSelect());
  const visibleOptions = ['site', 'supplier'].includes(variant) ? [...options].sort((a, b) => Number(enabledOption(b)) - Number(enabledOption(a))) : options;
  const canOpen = !disabled && (!['worker', 'supplier'].includes(variant) || options.length > 0);
  useEffect(() => { if (!canOpen) setOpen(false); }, [canOpen]);
  useBackLayer(open, () => setOpen(false));
  const [menuStyle, setMenuStyle] = useState({});
  const root = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const rect = trigger.current.getBoundingClientRect();
    const viewport = window.visualViewport;
    const bottom = (viewport?.height ?? window.innerHeight) + (viewport?.offsetTop ?? 0);
    const availableBelow = bottom - rect.bottom - 12;
    const above = availableBelow < 140 && rect.top > availableBelow;
    setMenuStyle({ maxHeight: Math.min(maxMenuHeight, Math.max(80, above ? rect.top - 12 : availableBelow)), ...(above ? { bottom: 'calc(100% - 1px)' } : { top: 'calc(100% - 1px)' }) });
    list.current?.querySelector('button:not(:disabled)')?.focus();
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, maxMenuHeight]);

  function select(option) {
    onSelected(option);
    setOpen(false);
    trigger.current?.focus();
  }
  function keys(event) {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    if (event.key === 'Tab') setOpen(false);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const buttons = [...list.current.querySelectorAll('button:not(:disabled)')];
      const current = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : event.key === 'ArrowDown' ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }
  return (
    <div className="selection-dropdown" data-variant={variant} data-placeholder={!selected || undefined} data-disabled={disabled || undefined} ref={root}>
      <label id={id + '-label'}>{label}</label>
      <div className="selection-dropdown-anchor">
        <button ref={trigger} type="button" className={'selection-field' + (open ? ' is-open' : '')}
          aria-labelledby={id + '-label'} aria-haspopup="listbox" aria-expanded={open} aria-controls={id}
          disabled={disabled} aria-disabled={!canOpen} onClick={() => { if (canOpen) setOpen(value => !value); }}
          onKeyDown={event => { if (event.key === 'ArrowDown' && !open && canOpen) { event.preventDefault(); setOpen(true); } }}>
          <span className="selection-icon"><img src={'/assets/drawable/' + icon + '.svg'} alt="" /></span>
          <span className="selection-value" data-all-sites={selected?.isAllSites || undefined}>{selected?.getName() ?? (variant === 'worker' ? (!disabled && !options.length ? 'Učitavanje...' : placeholder) : ['site', 'supplier'].includes(variant) ? placeholder : (options.length === 0 && emptyText ? emptyText : placeholder))}</span>
          {(!disabled || showChevronWhenDisabled || variant !== 'default') && <img className="selection-chevron" src={'/assets/drawable/ic_chevron_' + (open ? 'down' : 'right') + '.svg'} alt="" />}
        </button>
        {open && canOpen && <div ref={list} id={id} role="listbox" aria-labelledby={id + '-label'} className="selection-options" style={menuStyle} onKeyDown={keys}>
          {visibleOptions.map((option, index) => <button key={index} type="button" role="option"
            data-all-sites={option.isAllSites || undefined} aria-selected={selected === option} disabled={!enabledOption(option)} onClick={() => select(option)}>
            <span className="selection-icon"><img src={'/assets/drawable/' + icon + '.svg'} alt="" /></span>
            <span className="selection-value">{option.getName()}</span>
          </button>)}
          {options.length === 0 && variant === 'default' && <p className="empty-options">{emptyText ?? 'Nema dostupnih opcija.'}</p>}
        </div>}
      </div>
    </div>
  );
}
