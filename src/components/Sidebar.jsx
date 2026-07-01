import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: 'dashboard' },
    { id: 'pacientes', label: 'Pacientes', icon: 'person_search' },
    { id: 'voluntariado', label: 'Voluntariado', icon: 'group' },
    { id: 'estadisticas', label: 'Estadísticas', icon: 'leaderboard' },
    { id: 'administracion', label: 'Administración', icon: 'settings' }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Identity */}
      <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 16px', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <img src="/logo_icon.png" alt="Palia Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.02em' }}>Palia</h1>
        <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: 700 }}>Cuidados Paliativos</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <a
            key={item.id}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveTab(item.id);
              }
            }}
          >
            <span className="material-symbols-outlined" data-icon={item.icon}>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Footer Settings / Exit */}
      <div className="sidebar-footer">
        <a className={`nav-link ${activeTab === 'configuracion' ? 'active' : ''}`} onClick={() => setActiveTab('configuracion')} role="button">
          <span className="material-symbols-outlined" data-icon="settings">settings</span>
          <span>Configuración</span>
        </a>
        <a className="nav-link text-error" onClick={onLogout} role="button">
          <span className="material-symbols-outlined" data-icon="logout">logout</span>
          <span>Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  );
}
