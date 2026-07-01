import React, { useState, useRef, useEffect } from 'react';
import { dbService } from '../services/db';

export default function Header({ searchVal, setSearchVal, onSearchFocus, user, onLogout }) {
  const isCloud = dbService.isCloudBackend();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const alerts = dbService.getPatients().filter(p => p.currentStatus === 'Alerta');

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close notifications popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Close profile popover when clicking outside
  useEffect(() => {
    const handleClickOutsideProfile = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutsideProfile);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideProfile);
  }, [showProfileDropdown]);

  return (
    <header className="top-header">
      {isMobile ? (
        /* Mobile brand title (visible on mobile only) */
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>healing</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>Cuidados Paliativos</span>
        </div>
      ) : (
        /* Search Bar (desktop only) */
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
      )}

      {/* Action Buttons & Profile */}
      <div className="header-actions" style={{ position: 'relative' }}>
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon-btn" aria-label="Notificaciones" onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative' }}>
            <span className="material-symbols-outlined">notifications</span>
            {alerts.length > 0 && (
              <span className="badge" style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', backgroundColor: 'var(--color-error)', borderRadius: 'var(--radius-full)' }}></span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-popover card">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notifications_active</span>
                Alertas del Día
              </h3>
              <div style={{ height: '1px', backgroundColor: 'var(--color-outline-variant)', margin: '8px 0 12px 0' }}></div>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-outline-variant)' }}>notifications_off</span>
                  <p style={{ fontSize: '13px', color: 'var(--color-outline)', margin: '8px 0 0 0' }}>No hay alertas activas en este momento.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {alerts.map(p => (
                    <div key={p.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-error-container)',
                      color: 'var(--color-on-error-container)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-error)' }}>warning</span>
                      <div style={{ flexGrow: 1 }}>
                        <strong>{p.name}</strong> requiere atención urgente.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="header-divider"></div>
        
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div 
            className="user-profile-menu" 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{ cursor: 'pointer' }}
          >
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

          {showProfileDropdown && (
            <div 
              className="notification-popover card" 
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '240px',
                padding: '16px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>{user?.displayName || 'Coordinador Palia'}</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--color-outline)', wordBreak: 'break-all' }}>{user?.email || 'coordinacion@palia.org'}</span>
                <span className="chip chip-info" style={{ alignSelf: 'flex-start', fontSize: '11px', marginTop: '6px' }}>Equipo Palia</span>
              </div>
              
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-outline-variant)', margin: '4px 0' }} />
              
              <button 
                className="btn btn-error" 
                onClick={onLogout}
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '13px',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-error-container)',
                  color: 'var(--color-error)',
                  borderColor: 'var(--color-error)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-error)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
