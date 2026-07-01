import React, { useState, useEffect } from 'react';
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

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('palia_user') || 'null'));
  const [activeTab, setActiveTab] = useState('inicio');
  const [currentView, setCurrentView] = useState('inicio'); // Handles sub-routing
  const [searchVal, setSearchVal] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  // Deep-link into Administration sub-tabs (e.g. 'invitaciones')
  const [adminInitialTab, setAdminInitialTab] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('palia_user');
    setUser(null);
  };

  // Sync currentView with activeTab when sidebar clicks occur
  const handleTabChange = (tabId, subTab = null) => {
    setActiveTab(tabId);
    setCurrentView(tabId);
    setSearchVal('');
    if (tabId === 'administracion' && subTab) {
      setAdminInitialTab(subTab);
    } else {
      setAdminInitialTab(null);
    }
  };

  // Initialize DB with seed data on mount
  useEffect(() => {
    dbService.initialize();
  }, []);

  const handlePatientSaveSuccess = (newId) => {
    setSelectedPatientId(newId);
    setCurrentView('detalle-paciente');
    setActiveTab('pacientes');
  };

  const handleFollowUpSaveSuccess = () => {
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
        return <HomeDashboard user={user} onNavigate={handleTabChange} onViewDetail={(id) => { setSelectedPatientId(id); setCurrentView('detalle-paciente'); }} />;
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
        return <Settings onNavigate={handleTabChange} />;
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
