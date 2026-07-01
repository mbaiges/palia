import React from 'react';
import { dbService } from '../services/db';

export default function Header({ searchVal, setSearchVal, onSearchFocus }) {
  const isCloud = dbService.isCloudBackend();

  return (
    <header className="top-header">
      {/* Search Bar */}
      <div className="header-search-container">
        <div className="header-search">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Buscar paciente o registro..."
            value={searchVal || ''}
            onChange={(e) => setSearchVal && setSearchVal(e.target.value)}
            onFocus={onSearchFocus}
            aria-label="Buscar paciente o registro"
          />
        </div>

        {/* Database Status Badge */}
        <div className="db-status-badge">
          <span className="material-symbols-outlined db-status-icon" style={{ fontSize: '18px', color: isCloud ? '#0070f3' : 'var(--color-secondary)' }}>
            {isCloud ? 'cloud' : 'database'}
          </span>
          <span className="db-status-text">
            {isCloud ? 'Nube (Firebase)' : 'Persistencia Local'}
          </span>
        </div>
      </div>

      {/* Action Buttons & Profile */}
      <div className="header-actions">
        <button className="icon-btn" aria-label="Notificaciones">
          <span className="material-symbols-outlined">notifications</span>
          <span className="badge"></span>
        </button>
        <button className="icon-btn" aria-label="Ayuda">
          <span className="material-symbols-outlined">help</span>
        </button>
        
        <div className="header-divider"></div>
        
        <div className="user-profile-menu">
          <div className="user-avatar" aria-label="Avatar del usuario administrador">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdXGuMCmzFL7Ymvch2Hc8CVe66MyxzA9MPk0_rnJQrR3mRNdxP3IygPbo2oFctVDuxLgYqjV1nUPmxIyaFISVXppyZKKtSrI8WU-4dBaWrUkpqkHUNbRjzCD82zHbf-2yO0-tEhgalTSGZcAyAg3KK5pKw9Wfhf8zqCOvzTPjZMFgqe2hVqS1kpsxH-8z-F_usFld3wvq4nRvmO2GzxGp6V8p3Vk8QAV61cC2nPLvwnKAGnq5i8Y6qxsS3r83q5wGpyQdCuU6XjQ8" 
              alt="Avatar Admin" 
            />
          </div>
          <span className="user-name">Admin Medice</span>
          <span className="material-symbols-outlined">expand_more</span>
        </div>
      </div>
    </header>
  );
}
