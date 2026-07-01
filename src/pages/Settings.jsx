import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Settings() {
  const [theme, setTheme] = useState(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const isCloud = dbService.isCloudBackend();
  const [swStatus, setSwStatus] = useState('Registrado y Activo');
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'No compatible');

  const handleResetData = () => {
    if (confirm('¿Está seguro de que desea restablecer todos los datos del simulador? Se perderán los pacientes y seguimientos creados.')) {
      localStorage.clear();
      alert('Datos restablecidos con éxito. La página se recargará.');
      window.location.reload();
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotifPermission(permission);
        if (permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('Palia', {
              body: 'Notificaciones habilitadas desde la configuración.',
              icon: '/logo.png'
            });
          });
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--color-on-background)' }}>Configuración de Palia</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Gestione las preferencias de la aplicación y la sincronización de datos.</p>
      </div>

      <div className="bento-grid">
        {/* Visual Preferences */}
        <div className="card" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>palette</span>
            <h2 style={{ fontSize: '20px' }}>Preferencias Visuales</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
            <div>
              <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>Modo Oscuro</strong>
              <p style={{ fontSize: '13px', color: 'var(--color-outline)', margin: '2px 0 0 0' }}>Cambiar esquema de colores de la interfaz.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Database & Data Sync */}
        <div className="card" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-secondary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>database</span>
            <h2 style={{ fontSize: '20px' }}>Persistencia de Datos</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
            <div>
              <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>Modo Nube (Firebase)</strong>
              <p style={{ fontSize: '13px', color: 'var(--color-outline)', margin: '2px 0 0 0' }}>Estado del servicio de sincronización.</p>
            </div>
            <span className="chip chip-info" style={{ backgroundColor: isCloud ? '#e6f4ea' : 'var(--color-surface-container-high)', color: isCloud ? '#137333' : 'var(--color-on-surface-variant)', fontSize: '12px' }}>
              {isCloud ? 'Firebase Activo' : 'Persistencia Local'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>Restablecer Simulador</strong>
              <p style={{ fontSize: '13px', color: 'var(--color-outline)', margin: '2px 0 0 0' }}>Borrar base de datos local y reinstalar datos semilla.</p>
            </div>
            <button className="btn btn-error" onClick={handleResetData} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
              Restablecer
            </button>
          </div>
        </div>

        {/* PWA & Notifications */}
        <div className="card" style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>notifications_active</span>
            <h2 style={{ fontSize: '20px' }}>Instalación PWA y Notificaciones</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '8px' }}>
            <div style={{ borderRight: '1px solid var(--color-outline-variant)', paddingRight: '24px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px' }}>Estado de la PWA</h3>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--color-on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Service Worker:</strong> {swStatus}</li>
                <li><strong>Modo Offline:</strong> Soportado (Almacenamiento local activo)</li>
                <li><strong>Caché de activos:</strong> Activo (Versión 1.0)</li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px' }}>Permisos de Notificación</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                  Estado actual: <strong style={{ textTransform: 'capitalize' }}>{notifPermission}</strong>
                </span>
                {notifPermission !== 'granted' && (
                  <button className="btn btn-primary" onClick={requestNotificationPermission} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                    Habilitar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
