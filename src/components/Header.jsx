import React from 'react';
import { dbService } from '../services/db';

export default function Header({ searchVal, setSearchVal, onSearchFocus, user }) {
  const isCloud = dbService.isCloudBackend();

  const handleRequestNotifications = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification('Palia', {
                body: 'Notificaciones activadas con éxito.',
                icon: '/logo.png',
                badge: '/logo.png'
              });
            });
          }
        }
      });
    }
  };

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
        <button className="icon-btn" aria-label="Notificaciones" onClick={handleRequestNotifications}>
          <span className="material-symbols-outlined">notifications</span>
          <span className="badge"></span>
        </button>
        <button className="icon-btn" aria-label="Ayuda">
          <span className="material-symbols-outlined">help</span>
        </button>
        
        <div className="header-divider"></div>
        
        <div className="user-profile-menu">
          <div className="user-avatar" aria-label="Avatar del usuario administrador">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar Admin" />
            ) : (
              <span>{user?.displayName ? user.displayName[0].toUpperCase() : 'A'}</span>
            )}
          </div>
          <span className="user-name">{user?.displayName || 'Admin Palia'}</span>
          <span className="material-symbols-outlined">expand_more</span>
        </div>
      </div>
    </header>
  );
}
