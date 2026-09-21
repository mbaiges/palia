import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import OfflineSync from '../components/OfflineSync';
import { applyTheme, getStoredTheme } from '../tokens.js';
import { scrollToSection } from '../utils/navigation';
import { disablePushNotifications, enablePushNotifications, getPushSubscription } from '../services/pushNotifications';

export default function Settings({ onNavigate, initialFocus, onFocusConsumed }) {
  const [theme, setTheme] = useState(() => getStoredTheme());
  const isCloud = dbService.isCloudBackend();
  const profile = dbService.getProfile() ?? {};
  const [profileForm, setProfileForm] = useState({ phone: '', specialtyAvailability: '', tenure: '', avatarUrl: '' });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [swStatus, setSwStatus] = useState('Registrado y Activo');
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'No compatible');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('preferencias');
  const [syncFocusSection, setSyncFocusSection] = useState(null);

  useEffect(() => {
    let active = true;
    getPushSubscription().then((subscription) => { if (active) setPushEnabled(Boolean(subscription)); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setProfileForm({
      phone: profile.phone ?? '',
      specialtyAvailability: profile.specialtyAvailability ?? '',
      tenure: profile.tenure ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    });
  }, [profile.phone, profile.specialtyAvailability, profile.tenure, profile.avatarUrl]);

  useEffect(() => {
    if (!initialFocus) return;
    if (initialFocus.subTab) setActiveSubTab(initialFocus.subTab);
    if (initialFocus.sectionId) {
      if (initialFocus.subTab === 'sincronizacion' || initialFocus.sectionId.startsWith('sync-')) {
        setSyncFocusSection(initialFocus.sectionId);
      } else {
        scrollToSection(initialFocus.sectionId);
      }
    }
    onFocusConsumed?.();
  }, [initialFocus, onFocusConsumed]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const togglePush = async () => {
    setPushBusy(true); setPushMessage('');
    try {
      if (pushEnabled) { await disablePushNotifications(); setPushEnabled(false); }
      else { await enablePushNotifications(setNotifPermission); setPushEnabled(true); }
      setNotifPermission('Notification' in window ? Notification.permission : 'No compatible');
    } catch (error) { setPushMessage(error.status === 503 ? 'Las notificaciones push no están configuradas en el servidor.' : error.message || 'No se pudo actualizar la suscripción push.'); }
    finally { setPushBusy(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage('');
    try {
      await dbService.saveVolunteer(profileForm);
      setProfileMessage('Perfil guardado.');
    } catch (error) {
      setProfileMessage(error.message || 'No se pudo guardar el perfil.');
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--color-on-background)', margin: 0, fontSize: 'clamp(24px, 7vw, 32px)', lineHeight: 1.2, overflowWrap: 'anywhere' }}>Configuración de Palia</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px', margin: 0, maxWidth: '100%', overflowWrap: 'anywhere', fontSize: '14px' }}>
          Gestione las preferencias de la aplicación, la sincronización offline y accesos.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeSubTab === 'preferencias' ? 'btn-primary' : 'btn-tertiary'}`}
          onClick={() => setActiveSubTab('preferencias')}
          style={{ flex: '1 1 150px', minWidth: 0, minHeight: '36px', height: 'auto', padding: '8px 10px', lineHeight: 1.2, fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          Preferencias de Usuario
        </button>
        <button
          className={`btn ${activeSubTab === 'sincronizacion' ? 'btn-primary' : 'btn-tertiary'}`}
          onClick={() => setActiveSubTab('sincronizacion')}
          style={{ flex: '1 1 150px', minWidth: 0, minHeight: '36px', height: 'auto', padding: '8px 10px', lineHeight: 1.2, fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          Centro de Sincronización
        </button>
      </div>

      {activeSubTab === 'preferencias' && (
        <div className="bento-grid">
          <form className="card" onSubmit={saveProfile} style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>person</span>
              <div>
                <h2 style={{ fontSize: '20px', margin: 0 }}>Mi perfil de voluntariado</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: '4px 0 0' }}>La identidad y el rol se administran desde el acceso autorizado.</p>
              </div>
            </div>
            <div className="bento-grid">
              <label className="form-group" style={{ gridColumn: 'span 6' }}>Teléfono
                <input autoComplete="tel" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} maxLength={40} />
              </label>
              <label className="form-group" style={{ gridColumn: 'span 6' }}>Especialidad y disponibilidad
                <input value={profileForm.specialtyAvailability} onChange={(event) => setProfileForm({ ...profileForm, specialtyAvailability: event.target.value })} maxLength={240} />
              </label>
              <label className="form-group" style={{ gridColumn: 'span 6' }}>Trayectoria
                <input value={profileForm.tenure} onChange={(event) => setProfileForm({ ...profileForm, tenure: event.target.value })} maxLength={240} />
              </label>
              <label className="form-group" style={{ gridColumn: 'span 6' }}>URL de imagen de perfil
                <input type="url" value={profileForm.avatarUrl} onChange={(event) => setProfileForm({ ...profileForm, avatarUrl: event.target.value })} maxLength={2048} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 12 }}>
              <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>Pacientes asignados: <strong>{dbService.getVolunteers().find((volunteer) => volunteer.id === dbService.getCurrentUserId())?.activePatients ?? 0}</strong> · Rol: <strong>{dbService.getRole()}</strong></span>
              <button type="submit" className="btn btn-primary" disabled={profileBusy}>{profileBusy ? 'Guardando…' : 'Guardar perfil'}</button>
            </div>
            {profileMessage && <p role="status" aria-live="polite" style={{ margin: 0, color: profileMessage === 'Perfil guardado.' ? 'var(--color-success)' : 'var(--color-error)' }}>{profileMessage}</p>}
          </form>

          {/* Visual Preferences */}
          <div className="card" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>palette</span>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Preferencias Visuales</h2>
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
              <h2 style={{ fontSize: '20px', margin: 0 }}>Persistencia de Datos</h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>API de datos</strong>
                <p style={{ fontSize: '13px', color: 'var(--color-outline)', margin: '2px 0 0 0' }}>Los cambios se guardan en el servidor de la organización.</p>
              </div>
              <span className="chip chip-info" style={{ backgroundColor: isCloud ? '#e6f4ea' : 'var(--color-surface-container-high)', color: isCloud ? '#137333' : 'var(--color-on-surface-variant)', fontSize: '12px' }}>
                {isCloud ? 'API activa' : 'Desconectado'}
              </span>
            </div>

          </div>

          {/* PWA & Notifications */}
          <div className="card" style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>notifications_active</span>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Instalación PWA y Notificaciones</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '8px' }}>
              <div style={{ borderRight: '1px solid var(--color-outline-variant)', paddingRight: '24px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px', margin: 0, fontWeight: 700 }}>Estado de la PWA</h3>
                <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--color-on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0 0 0' }}>
                  <li><strong>Service Worker:</strong> {swStatus}</li>
                  <li><strong>Modo Offline:</strong> Soportado (Almacenamiento local activo)</li>
                  <li><strong>Datos offline:</strong> Fichas asignadas abiertas y seguimientos pendientes</li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px', margin: 0, fontWeight: 700 }}>Permisos de Notificación</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                    Estado actual: <strong style={{ textTransform: 'capitalize' }}>{notifPermission}</strong>
                  </span>
                  <button className="btn btn-primary" disabled={pushBusy} onClick={togglePush} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                    {pushBusy ? 'Guardando…' : pushEnabled ? 'Deshabilitar push' : 'Habilitar push'}
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>Las alertas del equipo se notifican con un mensaje genérico, sin datos del paciente.</p>
                {pushMessage && <p role="alert" style={{ fontSize: '13px', color: 'var(--color-error)' }}>{pushMessage}</p>}
              </div>
            </div>
          </div>

          {/* System Administration panel link */}
          {onNavigate && (
            <div className="card" style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
                <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>admin_panel_settings</span>
                <h2 style={{ fontSize: '20px', margin: 0 }}>Administración del Sistema</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                  Acceda a la gestión de hospitales, centros de salud, personal e invitaciones de voluntarios.
                </span>
                <button className="btn btn-primary" onClick={() => onNavigate('administracion', { subTab: 'invitaciones', sectionId: 'admin-invitations-panel' })} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                  Panel de Administración
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'sincronizacion' && (
        <OfflineSync focusSection={syncFocusSection} onFocusConsumed={() => setSyncFocusSection(null)} />
      )}
    </div>
  );
}
