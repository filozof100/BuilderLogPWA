import React from 'react';
import { createRoot } from 'react-dom/client';
import Session from './com/s2d2/radulovic/network/Session.js';
import getSharedPreferences from './com/s2d2/radulovic/utils/SharedPreferences.js';
import RadulovicApplication from './com/s2d2/radulovic/RadulovicApplication.jsx';
import './com/s2d2/radulovic/ui/theme/Theme.css';
import './com/s2d2/radulovic/ui/theme/TypographyParity.css';

// A new document starts at login; saved credentials control automatic sign-in.
// Returning to the running document does not execute this startup code again.
Session.clearSession();
getSharedPreferences('com.s2d2.radulovic.LOGIN_PREFERENCES').edit().remove('user_role').apply();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RadulovicApplication />
  </React.StrictMode>,
);

