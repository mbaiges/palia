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

  const handleLogout = () => {
    localStorage.removeItem('palia_user');
    setUser(null);
  };

  // Sync currentView with activeTab when sidebar clicks occur
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentView(tabId);
    setSearchVal('');
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
        return <HomeDashboard onNavigate={handleTabChange} onViewDetail={(id) => { setSelectedPatientId(id); setCurrentView('detalle-paciente'); }} />;
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
        return <Administration />;
      case 'configuracion':
        return <Settings />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar for Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} />
      
      {/* Mobile navigation bottom bar */}
      <nav className="mobile-nav">
        <a 
          className={`mobile-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
          onClick={() => handleTabChange('inicio')}
          role="button"
        >
          <span className="material-symbols-outlined">home</span>
          <span>Inicio</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
          onClick={() => handleTabChange('pacientes')}
          role="button"
        >
          <span className="material-symbols-outlined">person_search</span>
          <span>Directorio</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => handleTabChange('estadisticas')}
          role="button"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>Estadísticas</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'configuracion' ? 'active' : ''}`}
          onClick={() => handleTabChange('configuracion')}
          role="button"
        >
          <span className="material-symbols-outlined">person</span>
          <span>Perfil</span>
        </a>
      </nav>

      <div className="main-content">
        <Header 
          searchVal={searchVal} 
          setSearchVal={setSearchVal} 
          onSearchFocus={() => activeTab !== 'pacientes' && handleTabChange('pacientes')}
          user={user}
        />
        
        <main className="content-canvas">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
