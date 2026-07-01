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
import { dbService } from './services/db';
import Login from './pages/Login';
import Settings from './pages/Settings';
import HomeDashboard from './pages/HomeDashboard';
import { scrollToSection, resetContentScroll } from './utils/navigation';
import { syncMobileLayout, syncViewportHeight, syncMobileNavOffset } from './utils/viewport';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('palia_user') || 'null'));
  const [activeTab, setActiveTab] = useState('inicio');
  const [currentView, setCurrentView] = useState('inicio');
  const [searchVal, setSearchVal] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [adminInitialTab, setAdminInitialTab] = useState(null);
  const [settingsFocus, setSettingsFocus] = useState(null);
  const pendingScrollRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('palia_user');
    setUser(null);
  };

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

  // Initialize DB with seed data on mount
  useEffect(() => {
    dbService.initialize();
  }, []);

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
    
    if (currentView === 'detalle-paciente') {
      return (
        <PatientDetail 
          patientId={selectedPatientId} 
          onBack={() => handleTabChange('pacientes')} 
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

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  // Check if the user has admin role to show admin nav on mobile
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin') || true; // default all users can see admin

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
        {isAdmin && (
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
