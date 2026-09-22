import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Patients from './pages/Patients';
import NewPatient from './pages/NewPatient';
import PatientDetail from './pages/PatientDetail';
import NewFollowUp from './pages/NewFollowUp';
import Volunteers from './pages/Volunteers';
import Stats from './pages/Stats';
import Administration from './pages/Administration';
import { apiRepository, dbService, offlineStore } from './services/container';
import Login from './pages/Login';
import Settings from './pages/Settings';
import HomeDashboard from './pages/HomeDashboard';
import { scrollToSection, resetContentScroll } from './utils/navigation';
import { syncMobileLayout, syncViewportHeight, syncMobileNavOffset } from './utils/viewport';
import { disablePushNotifications, syncExistingPushSubscription } from './services/pushNotifications';

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [, setDataVersion] = useState(0);
  const [activeTab, setActiveTab] = useState('inicio');
  const [currentView, setCurrentView] = useState('inicio');
  const [searchVal, setSearchVal] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [adminInitialTab, setAdminInitialTab] = useState(null);
  const [settingsFocus, setSettingsFocus] = useState(null);
  const pendingScrollRef = useRef(null);

  const openAlertFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const alertId = params.get('alertId');
    if (!alertId) return;
    const patientId = dbService.getAlerts().find((alert) => alert.id === alertId)?.patientId;
    if (patientId) {
      setSelectedPatientId(patientId);
      setCurrentView('detalle-paciente');
      setActiveTab('pacientes');
    }
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleLogout = async () => {
    try { await disablePushNotifications({ bestEffort: true, apiRepository }).catch(() => undefined); await apiRepository.auth.signOut(); } finally { dbService.clear(); setUser(null); }
  };

  const acceptLogin = async (identity) => {
    await dbService.initialize();
    openAlertFromUrl();
    await dbService.saveOfflineIdentity({ id: identity.id, displayName: identity.displayName ?? identity.name, role: identity.role });
    await syncExistingPushSubscription({ apiRepository }).catch(() => undefined);
    await dbService.syncOffline();
    setUser(identity);
  };

  useEffect(() => {
    let active = true;
    apiRepository.auth.me().then(async (auth) => {
      if (!active) return;
      await dbService.initialize();
      openAlertFromUrl();
      const identity = { ...auth.user, displayName: auth.user.name, photoURL: auth.user.profileImageId, role: auth.role };
      await dbService.saveOfflineIdentity({ id: identity.id, displayName: identity.displayName, role: identity.role });
      await syncExistingPushSubscription({ apiRepository }).catch(() => undefined);
      if (active) { setUser(identity); await dbService.syncOffline(); }
    }).catch(async (error) => {
      if (!active) return;
      if (error instanceof TypeError || !navigator.onLine) {
        try {
          const identity = await offlineStore.getLastIdentity();
          if (identity) {
            await dbService.initializeOffline(identity);
            if (active) setUser({ id: identity.id, name: identity.name, displayName: identity.name, role: identity.role, offline: true });
            return;
          }
        } catch { /* Without a previously authenticated profile the login screen remains visible. */ }
      }
      await dbService.clear(); setUser(null);
    }).finally(() => { if (active) setAuthReady(true); });
    const unsubscribe = dbService.subscribe(() => setDataVersion((version) => version + 1));
    const onUnauthorized = () => { dbService.clear(); setUser(null); };
    window.addEventListener('medice:unauthorized', onUnauthorized);
    const onBackendChanged = async () => {
      if (!active) return;
      setAuthReady(false);
      try {
        const auth = await apiRepository.auth.me();
        await dbService.initialize();
        const identity = { ...auth.user, displayName: auth.user.name, photoURL: auth.user.profileImageId, role: auth.role };
        await dbService.saveOfflineIdentity({ id: identity.id, displayName: identity.displayName, role: identity.role });
        if (active) setUser(identity);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setAuthReady(true);
      }
    };
    window.addEventListener('medice:backend-changed', onBackendChanged);
    const syncWhenOnline = () => { dbService.syncOffline().catch(() => undefined); };
    window.addEventListener('online', syncWhenOnline);
    return () => { active = false; unsubscribe(); window.removeEventListener('medice:unauthorized', onUnauthorized); window.removeEventListener('medice:backend-changed', onBackendChanged); window.removeEventListener('online', syncWhenOnline); };
  }, []);

  const normalizeNavOptions = (secondArg) => {
    if (typeof secondArg === 'string') return { subTab: secondArg };
    return secondArg || {};
  };

  const handleTabChange = (tabId, secondArg = null) => {
    const { subTab, sectionId, settingsSubTab } = normalizeNavOptions(secondArg);

    if (tabId === 'nuevo-paciente') {
      setActiveTab('pacientes');
      setCurrentView('nuevo-paciente');
    } else {
      setActiveTab(tabId);
      setCurrentView(tabId);
    }

    setSearchVal('');

    if (tabId === 'administracion' && subTab) {
      setAdminInitialTab(subTab);
    } else if (tabId !== 'administracion') {
      setAdminInitialTab(null);
    }

    if (tabId === 'configuracion' && (settingsSubTab || sectionId)) {
      setSettingsFocus({ subTab: settingsSubTab, sectionId });
    }

    pendingScrollRef.current = sectionId || '__top__';
  };

  const handleViewPatient = (patientId, options = {}) => {
    pendingScrollRef.current = '__top__';
    setSelectedPatientId(patientId);
    setCurrentView('detalle-paciente');
    setActiveTab('pacientes');
    if (options.openFollowUp) {
      setCurrentView('nuevo-seguimiento');
    }
  };

  useEffect(() => {
    const scrollTarget = pendingScrollRef.current;
    if (!scrollTarget) return;
    pendingScrollRef.current = null;

    const timer = window.setTimeout(() => {
      if (scrollTarget === '__top__') {
        resetContentScroll();
      } else {
        scrollToSection(scrollTarget);
      }
    }, 60);

    return () => window.clearTimeout(timer);
  }, [activeTab, currentView]);

  useEffect(() => {
    if (!user) return undefined;
    const syncLayout = () => {
      syncMobileLayout();
    };
    syncLayout();
    const timer = window.setTimeout(syncLayout, 120);
    return () => window.clearTimeout(timer);
  }, [user, activeTab, currentView]);

  const handlePatientSaveSuccess = (newId) => {
    pendingScrollRef.current = '__top__';
    setSelectedPatientId(newId);
    setCurrentView('detalle-paciente');
    setActiveTab('pacientes');
  };

  const handleFollowUpSaveSuccess = () => {
    pendingScrollRef.current = '__top__';
    setCurrentView('detalle-paciente');
  };

  // Render views based on sub-routing and activeTab
  const renderContent = () => {
    if (currentView === 'nuevo-paciente') {
      return (
        <NewPatient 
          onCancel={() => handleTabChange('pacientes')} 
          onSaveSuccess={handlePatientSaveSuccess}
        />
      );
    }

    if (currentView === 'editar-paciente') {
      return <NewPatient patient={dbService.getPatient(selectedPatientId)} onCancel={() => setCurrentView('detalle-paciente')} onSaveSuccess={handlePatientSaveSuccess} />;
    }
    
    if (currentView === 'detalle-paciente') {
      return (
        <PatientDetail 
          patientId={selectedPatientId} 
          user={user}
          onBack={() => handleTabChange('pacientes')} 
          onEdit={() => setCurrentView('editar-paciente')}
          onNewFollowUp={() => setCurrentView('nuevo-seguimiento')}
        />
      );
    }

    if (currentView === 'nuevo-seguimiento') {
      return (
        <NewFollowUp 
          patientId={selectedPatientId} 
          onCancel={() => setCurrentView('detalle-paciente')}
          onSaveSuccess={handleFollowUpSaveSuccess}
        />
      );
    }

    switch (activeTab) {
      case 'inicio':
        return <HomeDashboard user={user} onNavigate={handleTabChange} onViewDetail={(id) => handleViewPatient(id)} />;
      case 'pacientes':
        return (
          <Patients 
            searchVal={searchVal}
            canManage={canManage}
            onNewPatient={() => setCurrentView('nuevo-paciente')}
            onViewDetail={(id) => {
              setSelectedPatientId(id);
              setCurrentView('detalle-paciente');
            }}
          />
        );
      case 'voluntariado':
        return <Volunteers searchVal={searchVal} />;
      case 'estadisticas':
        return <Stats />;
      case 'administracion':
        return <Administration initialTab={adminInitialTab} onTabConsumed={() => setAdminInitialTab(null)} />;
      case 'configuracion':
        return <Settings onNavigate={handleTabChange} initialFocus={settingsFocus} onFocusConsumed={() => setSettingsFocus(null)} />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  if (!authReady) {
    return <div className="app-loading" role="status">Conectando con Palia…</div>;
  }

  if (!user) {
    return <Login onLoginSuccess={acceptLogin} />;
  }

  // Check if the user has admin role to show admin nav on mobile
  const canManage = user?.role === 'admin' || user?.role === 'coordinator';

  return (
    <div className="app-shell">
      {/* Sidebar for Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} />
      
      <div className="main-content">
        <Header 
          searchVal={searchVal} 
          setSearchVal={setSearchVal} 
          onSearchFocus={() => activeTab !== 'pacientes' && handleTabChange('pacientes')}
          user={user}
          onLogout={handleLogout}
          onNavigate={handleTabChange}
          onViewPatient={handleViewPatient}
          alertPatients={dbService.getPatients().filter((p) => p.currentStatus === 'Alerta')}
        />
        
        <main className="content-canvas">
          {renderContent()}
        </main>
      </div>

      {/* Mobile navigation bottom bar — in-flow footer (avoids iOS fixed-bar bounce) */}
      <nav className="mobile-nav">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
          onClick={() => handleTabChange('inicio')}
        >
          <span className="material-symbols-outlined">home</span>
          <span>Inicio</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
          onClick={() => handleTabChange('pacientes')}
        >
          <span className="material-symbols-outlined">person_search</span>
          <span>Directorio</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => handleTabChange('estadisticas')}
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>Stats</span>
        </button>
        {canManage && (
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === 'administracion' ? 'active' : ''}`}
            onClick={() => handleTabChange('administracion')}
          >
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span>Admin</span>
          </button>
        )}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'configuracion' ? 'active' : ''}`}
          onClick={() => handleTabChange('configuracion')}
        >
          <span className="material-symbols-outlined">person</span>
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
