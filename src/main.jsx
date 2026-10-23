import React from 'react';
import { createRoot } from 'react-dom/client';
import RadulovicApplication from './com/s2d2/radulovic/RadulovicApplication.jsx';
import './com/s2d2/radulovic/ui/theme/Theme.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RadulovicApplication />
  </React.StrictMode>,
);
