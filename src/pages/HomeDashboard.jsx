import React from 'react';
import { dbService } from '../services/db';

export default function HomeDashboard({ onNavigate, onViewDetail }) {
  const patients = dbService.getPatients();
  const followUps = dbService.getFollowUps ? dbService.getFollowUps() : [];

  const totalPatients = patients.length;
  const alertPatients = patients.filter(p => p.currentStatus === 'Alerta');
  const stablePatients = patients.filter(p => p.currentStatus === 'Estable');
  const observationPatients = patients.filter(p => p.currentStatus === 'En Observación');

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  const statsCards = [
    { label: 'Total Pacientes', value: totalPatients, icon: 'groups', color: 'var(--color-primary)', bg: 'var(--color-primary-container)', tab: 'pacientes' },
    { label: 'En Alerta', value: alertPatients.length, icon: 'priority_high', color: 'var(--color-error)', bg: 'var(--color-error-container)', tab: 'pacientes' },
    { label: 'En Observación', value: observationPatients.length, icon: 'warning', color: 'var(--color-secondary)', bg: 'var(--color-secondary-container)', tab: 'pacientes' },
    { label: 'Estables', value: stablePatients.length, icon: 'check_circle', color: '#4b6450', bg: '#cdead0', tab: 'pacientes' },
  ];

  const quickActions = [
    { label: 'Nuevo Paciente', icon: 'person_add', tab: 'nuevo-paciente', color: 'var(--color-primary)' },
    { label: 'Ver Pacientes', icon: 'person_search', tab: 'pacientes', color: 'var(--color-secondary)' },
    { label: 'Voluntariado', icon: 'group', tab: 'voluntariado', color: '#505355' },
    { label: 'Estadísticas', icon: 'leaderboard', tab: 'estadisticas', color: 'var(--color-primary)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Greeting Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #006781 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
            {today.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 700, margin: 0 }}>
            {greeting}, Equipo Palia
          </h1>
          <p style={{ opacity: 0.85, marginTop: '6px', fontSize: '15px' }}>
            {alertPatients.length > 0
              ? `⚠ Hay ${alertPatients.length} paciente${alertPatients.length > 1 ? 's' : ''} en situación de alerta que requieren atención.`
              : 'Todos los pacientes están siendo atendidos correctamente.'
            }
          </p>
        </div>
        <img src="/logo_icon.png" alt="Palia" style={{ width: '72px', height: '72px', opacity: 0.9, filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* Stats Cards */}
      <div className="bento-grid">
        {statsCards.map((card) => (
          <button
            key={card.label}
            className="card"
            style={{
              gridColumn: 'span 3',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onClick={() => onNavigate(card.tab)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,90,113,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: card.color, fontSize: '22px' }}>{card.icon}</span>
              </div>
              <span style={{ fontSize: '36px', fontWeight: 800, color: card.color }}>{card.value}</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>{card.label}</p>
            <div style={{ height: '4px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-surface-container-high)' }}>
              <div style={{ height: '100%', borderRadius: 'var(--radius-full)', backgroundColor: card.color, width: `${totalPatients > 0 ? (card.value / totalPatients * 100) : 0}%`, transition: 'width 0.5s ease' }} />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions + Alert Patients */}
      <div className="bento-grid">
        {/* Quick Actions */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-on-surface)' }}>Acciones Rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickActions.map(action => (
              <button
                key={action.tab}
                className="btn btn-tertiary"
                style={{ justifyContent: 'flex-start', gap: '12px', height: '48px', paddingLeft: '16px', width: '100%' }}
                onClick={() => onNavigate(action.tab)}
              >
                <span className="material-symbols-outlined" style={{ color: action.color }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Patients */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--color-on-surface)' }}>
              {alertPatients.length > 0 ? '⚠ Pacientes en Alerta' : 'Estado del Sistema'}
            </h2>
            <button className="btn btn-tertiary" style={{ height: '32px', padding: '0 12px', fontSize: '13px' }} onClick={() => onNavigate('pacientes')}>
              Ver todos
            </button>
          </div>

          {alertPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-secondary)', display: 'block', marginBottom: '12px' }}>check_circle</span>
              <p style={{ fontWeight: 600, fontSize: '16px' }}>Todo en orden</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>No hay pacientes en situación de alerta actualmente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alertPatients.slice(0, 5).map(patient => (
                <div
                  key={patient.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-error-container)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease',
                  }}
                  onClick={() => onViewDetail(patient.id)}
                  role="button"
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>warning</span>
                  <div style={{ flexGrow: 1 }}>
                    <strong style={{ color: 'var(--color-on-error-container)', fontSize: '14px' }}>{patient.name}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--color-on-error-container)', opacity: 0.8, margin: 0 }}>{patient.diagnosis}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-on-error-container)', fontSize: '18px' }}>chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
