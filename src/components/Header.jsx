import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { dbService } from '../services/db';

export default function Header({ searchVal, setSearchVal, onSearchFocus, user, onLogout, onNavigate }) {
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

  const toggleNotifications = () => {
    setShowNotifications((open) => {
      if (!open) setShowProfileDropdown(false);
      return !open;
    });
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((open) => {
      if (!open) setShowNotifications(false);
      return !open;
    });
  };

  // Close popovers when clicking/tapping outside (pointer events work on mobile)
  useEffect(() => {
    const handlePointerOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    if (showNotifications || showProfileDropdown) {
      document.addEventListener('pointerdown', handlePointerOutside);
    }
    return () => document.removeEventListener('pointerdown', handlePointerOutside);
  }, [showNotifications, showProfileDropdown]);

  return (
    <header className="top-header">
      {isMobile && (showNotifications || showProfileDropdown) && createPortal(
        <div
          className="mobile-popover-scrim"
          aria-hidden="true"
          onPointerDown={() => {
            setShowNotifications(false);
            setShowProfileDropdown(false);
          }}
        />,
        document.body
      )}
      {isMobile ? (
        /* Mobile brand — Palia logo */
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo_icon.png"
            alt="Palia"
            style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
          />
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>Palia</span>
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
          <button className="icon-btn" aria-label="Notificaciones" onClick={toggleNotifications} style={{ position: 'relative' }}>
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
            onClick={toggleProfileDropdown}
            role="button"
            tabIndex={0}
            aria-expanded={showProfileDropdown}
            aria-haspopup="true"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleProfileDropdown();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar" aria-label="Avatar del usuario administrador">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar Admin" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                />
              ) : (
                <span>{user?.displayName ? user.displayName[0].toUpperCase() : 'A'}</span>
              )}
            </div>
            {/* Only show name & arrow on desktop */}
            {!isMobile && (
              <>
                <span className="user-name">{user?.displayName || 'Admin Palia'}</span>
                <span className="material-symbols-outlined">expand_more</span>
              </>
            )}
          </div>

          {showProfileDropdown && (
            <div className="notification-popover profile-popover card">
              {/* Avatar + name section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
                  backgroundColor: 'var(--color-primary-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '18px' }}>
                      {user?.displayName ? user.displayName[0].toUpperCase() : 'A'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.displayName || 'Coordinador Palia'}
                  </strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-outline)', wordBreak: 'break-all' }}>
                    {user?.email || 'coordinacion@palia.org'}
                  </span>
                  <span className="chip chip-info" style={{ alignSelf: 'flex-start', fontSize: '10px', marginTop: '4px', padding: '2px 8px' }}>
                    Equipo Palia
                  </span>
                </div>
              </div>
              
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-outline-variant)', margin: '2px 0' }} />

              {/* Quick actions */}
              {onNavigate && (
                <button
                  className="btn btn-tertiary"
                  onClick={() => { setShowProfileDropdown(false); onNavigate('configuracion'); }}
                  style={{ width: '100%', height: '36px', fontSize: '13px', justifyContent: 'flex-start', gap: '8px', display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                  Configuración
                </button>
              )}
              
              <button 
                className="btn"
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
