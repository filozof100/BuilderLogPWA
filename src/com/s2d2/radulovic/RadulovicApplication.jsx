import Toast, { ToastHost, showToast } from './ui/components/Toast.jsx';
import AdminHomeActivity from './screens/admin/AdminHomeActivity.jsx';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import ManagerHomeActivity from './screens/manager/ManagerHomeActivity.jsx';
import SiteSelectionActivity from './screens/manager/SiteSelectionActivity.jsx';
import SettingsActivity from './screens/general/SettingsActivity.jsx';
import LoginActivity from './screens/general/LoginActivity.jsx';
import ExcavatorSelectionActivity from './screens/excavator_driver/ExcavatorSelectionActivity.jsx';
import TruckSelectionActivity from './screens/truck_driver/TruckSelectionActivity.jsx';
import TruckDriverActivity from './screens/truck_driver/TruckDriverActivity.jsx';
import ExcavatorDriverActivity from './screens/excavator_driver/ExcavatorDriverActivity.jsx';
import SettingsAccessBar from './ui/components/SettingsAccessBar.jsx';
import Session from './network/Session.js';
import WebUtils, { onAuthenticationFailure, onAuthenticatedRequestSuccess } from './network/WebUtils.js';
import useForegroundRefresh from './ui/components/useForegroundRefresh.js';
import SessionGuard from './SessionGuard.jsx';
import getSharedPreferences from './utils/SharedPreferences.js';
import Role from './employee/Role.js';
import NetworkLoadingState from './NetworkLoadingState.js';
import StartupSplash from './ui/components/StartupSplash.jsx';
import NetworkLoadingOverlay from './ui/components/NetworkLoadingOverlay.jsx';
import './ui/theme/DriverSelection.css';
import './ui/theme/DriverWork.css';

export default function RadulovicApplication() {
  const [screen, setScreen] = useState({ name: 'login' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timeout);
  }, [notice]);
  function closeSettings(message = '') {
    setSettingsOpen(false);
    setNotice(message);
  }
  const requestVersion = useRef(0);
  const automaticRecoveryAttempted = useRef(false);
  const requests = useSyncExternalStore(
    NetworkLoadingState.activeRequests.subscribe,
    () => NetworkLoadingState.activeRequests.value,
  );

  function logout() {
    setSettingsOpen(false);
    setNotice('');
    requestVersion.current++;
    Session.clearSession();
    setScreen({ name: 'login' });
  }

  function openSession(form) {
    const version = ++requestVersion.current;
    const role = Session.getCurrentUser().getRole();
    setScreen({ name: 'loading', role });
    const callback = {
      onSuccess(log) {
        if (version !== requestVersion.current) return;
        if (log == null) {
          setScreen({ name: 'selection', role });
        } else if (role === Role.SITE_MANAGER) {
          Session.setDefaultConstructionSite(log);
          setScreen({ name: 'manager-home', role, site: log });
        } else {
          const truck = role === Role.TRUCK_DRIVER;
          setScreen({ name: 'assigned', role, assignment: {
            machine: truck ? log.getTruck() : log.getExcavator(),
            siteName: truck ? '' : log.getConstructionSiteName(),
            logId: truck ? log.getTruckLogId() : log.getExcavatorLogId(),
          } });
        }
      },
      onFailure(exception) {
        if (version !== requestVersion.current) return;
        showToast(role === Role.TRUCK_DRIVER ? 'Neuspešno učitavanje dodeljenog kamiona' : role === Role.SITE_MANAGER ? 'Neuspešno učitavanje odabranog gradilišta' : 'Neuspešno učitavanje dodeljenog bagera');
        setScreen({ name: 'login', form, allowAutomaticLogin: false });
      },
    };
    if (role === Role.OPERATOR) Session.getAssignedExcavator(callback);
    else if (role === Role.TRUCK_DRIVER) Session.getAssignedTruck(callback);
    else if (role === Role.SITE_MANAGER) Session.getSelectedSelectionSiteFromSever(callback);
    else if (role === Role.ADMIN) setScreen({ name: 'admin-home', role });
    else { showToast('Nepoznata korisnička uloga'); setScreen({ name: 'unsupported', role }); }
  }

  function requireLogin(allowAutomaticLogin = true, error = '') {
    setSettingsOpen(false);
    requestVersion.current++;
    Session.clearSession();
    getSharedPreferences('com.s2d2.radulovic.LOGIN_PREFERENCES').edit().remove('user_role').apply();
    setScreen({ name: 'login', allowAutomaticLogin, error });
  }

  useEffect(() => {
    const stopFailure = onAuthenticationFailure(authorization => {
      // A delayed response from an old session must not log out a newer login.
      if (authorization !== Session.getSessionToken()) return;
      const remember = getSharedPreferences('com.s2d2.radulovic.LOGIN_PREFERENCES')
        .getBoolean('remember_me', false);
      const automatic = remember && !automaticRecoveryAttempted.current;
      if (automatic) automaticRecoveryAttempted.current = true;
      requireLogin(automatic, automatic ? '' : 'Sesija je istekla. Prijavite se ponovo.');
    });
    const stopSuccess = onAuthenticatedRequestSuccess(authorization => {
      // Allow later recovery once the server has accepted the new session.
      if (authorization === Session.getSessionToken()) automaticRecoveryAttempted.current = false;
    });
    return () => { stopFailure(); stopSuccess(); };
  }, []);

  const sessionCheckPending = useRef(false);
  useForegroundRefresh(() => {
    const token = Session.getSessionToken();
    if (sessionCheckPending.current || !token || !Session.getCurrentUser()) return;
    sessionCheckPending.current = true;
    // Validate the live session only; never restore a user or token from storage.
    // Authenticated 401 responses are handled by the shared listener above.
    WebUtils.sendGETRequest('me', {}, { Authorization: token }, {
      onSuccess() { sessionCheckPending.current = false; },
      onFailure() { sessionCheckPending.current = false; },
    });
  }, screen.name !== 'login' && screen.name !== 'loading');

  useEffect(() => () => { requestVersion.current++; }, []);

  function selected(assignment) {
    setScreen({ name: 'assigned', role: screen.role,
      assignment: { ...assignment, siteName: assignment.site.getName() } });
  }

  return (
    <>
      {screen.name === 'loading' ? <StartupSplash /> : screen.name === 'login'
        ? <LoginActivity onAuthenticated={openSession} initialError={screen.error} initialValues={screen.form} allowAutomaticLogin={screen.allowAutomaticLogin ?? true} />
        : <SessionGuard onSessionMissing={requireLogin}><main className="role-screen" hidden={settingsOpen}>
          {screen.name !== 'assigned' && screen.name !== 'manager-home' && screen.name !== 'admin-home' && Session.getCurrentUser() && <SettingsAccessBar onOpen={() => setSettingsOpen(true)} />}
          {screen.name === 'selection' && (screen.role === Role.SITE_MANAGER
            ? <SiteSelectionActivity onSelected={site => setScreen({ name: 'manager-home', role: screen.role, site })} />
            : screen.role === Role.TRUCK_DRIVER
            ? <TruckSelectionActivity onSelected={selected} />
            : <ExcavatorSelectionActivity onSelected={selected} />)}
          {screen.name === 'assigned' && (screen.role === Role.TRUCK_DRIVER
            ? <TruckDriverActivity assignment={screen.assignment} onSettings={() => setSettingsOpen(true)} />
            : <ExcavatorDriverActivity assignment={screen.assignment} onSettings={() => setSettingsOpen(true)} />)}
          {screen.name === 'admin-home' && <AdminHomeActivity onSettings={() => setSettingsOpen(true)} />}
          {screen.name === 'manager-home' && <ManagerHomeActivity active={!settingsOpen} onSettings={() => setSettingsOpen(true)} />}
          
          {screen.name === 'unsupported' && <section className="selection-body">
            <div className="selection-form"><p>Početni ekran za ovu korisničku ulogu još nije dostupan.</p>
              <button type="button" className="primary-button" onClick={logout}>Nazad na prijavu</button>
            </div>
          </section>}
        </main>
        {settingsOpen && <SettingsActivity onBack={closeSettings} onLogout={logout} />}
        </SessionGuard>}
      <Toast message={notice} onDismiss={() => setNotice('')}/><ToastHost/>
      {requests > 0 && screen.name !== 'loading' && <NetworkLoadingOverlay />}
    </>
  );
}
