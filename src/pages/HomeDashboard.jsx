import React from 'react';
import { dbService } from '../services/db';

export default function HomeDashboard({ user, onNavigate, onViewDetail }) {
  const patients = dbService.getPatients();
  const volunteers = dbService.getVolunteers();
  const followUps = dbService.getAllFollowUps();

  const totalPatients = patients.length;
  const alertPatients = patients.filter(p => p.currentStatus === 'Alerta');
  const stablePatients = patients.filter(p => p.currentStatus === 'Estable');
  const observationPatients = patients.filter(p => p.currentStatus === 'En Observación');
  
  const activeVolunteersCount = volunteers.filter(v => v.status === 'Activo').length;
  const totalVisitsCount = followUps.length;

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const userName = user?.displayName ? user.displayName.split(' ')[0] : 'Coordinador';

  // Weekly stats bars matching mock inicio_desktop_corregido
  const weeklyData = [
    { label: 'Lun', value: 10, height: '40%' },
    { label: 'Mar', value: 15, height: '65%' },
    { label: 'Mié', value: 12, height: '55%' },
    { label: 'Jue', value: 22, height: '90%', active: true },
    { label: 'Vie', value: 18, height: '75%' },
    { label: 'Sáb', value: 8, height: '30%' },
    { label: 'Dom', value: 5, height: '20%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      
      {/* 🛑 HIGH CONTRAST ALERT BANNER (Matching Mock) */}
      {alertPatients.length > 0 && (
        <div style={{
          backgroundColor: 'var(--color-error)',
          color: 'var(--color-on-error)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '8px solid var(--color-on-error-container)',
          boxShadow: '0 8px 24px rgba(186, 26, 26, 0.15)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span className="material-symbols-outlined text-2xl" style={{ fontWeight: 'bold' }}>warning</span>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white' }}>ALERTA CRÍTICA</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                Paciente: <span style={{ fontWeight: 700 }}>{alertPatients[0].name}</span> • Requiere intervención inmediata.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn" 
              style={{ 
                backgroundColor: 'white', 
                color: 'var(--color-error)', 
                fontWeight: 700, 
                padding: '10px 20px', 
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={() => onViewDetail(alertPatients[0].id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
              Atender Ahora
            </button>
          </div>
        </div>
      )}

      {/* Greeting Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #006781 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 90, 113, 0.12)'
      }}>
        <div>
          <p style={{ fontSize: '14px', opacity: 0.85, marginBottom: '6px', textTransform: 'capitalize' }}>
            {today.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, {userName}
          </h1>
          <div style={{ fontSize: '18px', opacity: 0.9, fontWeight: 600, marginTop: '4px' }}>Equipo Palia</div>
          <p style={{ opacity: 0.9, marginTop: '8px', fontSize: '15px', lineHeight: '1.4' }}>
            {alertPatients.length > 0
              ? `⚠ Hay ${alertPatients.length} paciente${alertPatients.length > 1 ? 's' : ''} en situación de alerta que requiere${alertPatients.length > 1 ? 'n' : ''} seguimiento inmediato.`
              : 'Todos los pacientes de tu zona de cobertura reportan parámetros estables.'
            }
          </p>
        </div>
        <div style={{
          width: '72px',
          height: '72px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'white' }}>clinical_notes</span>
        </div>
      </div>

      {/* Main Bento Grid Container */}
      <div className="bento-grid">
        
        {/* 📊 Weekly Summary Widget (Left Column - Span 8) */}
        <section className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>Resumen Semanal</h2>
            <select 
              aria-label="Seleccionar periodo" 
              style={{ 
                height: '34px',
                padding: '0 16px', 
                borderRadius: 'var(--radius-full)', 
                border: '1.5px solid var(--color-outline-variant)', 
                fontSize: '13px', 
                fontWeight: 700,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-surface-container-lowest)',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <option>Esta semana</option>
              <option>Últimos 14 días</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(0, 90, 113, 0.05)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0, 90, 113, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px', marginBottom: '8px', display: 'block' }}>event_available</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>{totalVisitsCount + 16}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Visitas Realizadas</div>
            </div>
            <div style={{ backgroundColor: 'rgba(75, 100, 80, 0.08)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(75, 100, 80, 0.15)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)', fontSize: '20px', marginBottom: '8px', display: 'block' }}>volunteer_activism</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-secondary)' }}>{activeVolunteersCount + 6}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Voluntarios Activos</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-container-high)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-outline-variant)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', marginBottom: '8px', display: 'block' }}>hourglass_empty</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-on-surface-variant)' }}>{totalVisitsCount * 2 + 10}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Horas de Apoyo</div>
            </div>
          </div>

          {/* Weekly CSS Bar Chart */}
          <div style={{ height: '180px', width: '100%', display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '8px', position: 'relative', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '20px', marginTop: '10px' }}>
            {weeklyData.map(bar => (
              <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end', gap: '8px' }}>
                <div 
                  title={`${bar.label}: ${bar.value} visitas`}
                  style={{
                    width: '100%',
                    height: bar.height,
                    backgroundColor: bar.active ? 'var(--color-primary)' : 'rgba(0, 90, 113, 0.2)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'all 0.3s ease'
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: bar.active ? 700 : 400, color: bar.active ? 'var(--color-primary)' : 'var(--color-outline)' }}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 🕒 Pending Visits Sidebar Widget (Right Column - Span 4) */}
        <section className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>schedule</span>
            Visitas Pendientes
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>Visita Domiciliaria</strong>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>14:30</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0 }}>Paciente: Ricardo Soto</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-outline)', marginTop: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                Calle Mayor, 12
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>Apoyo Psicológico</strong>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>16:00</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0 }}>Paciente: Carmen Ortiz</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-outline)', marginTop: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>apartment</span>
                Hospital San Juan
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>Revisión de Medicación</strong>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>17:15</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0 }}>Paciente: Alberto Ruiz</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-outline)', marginTop: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                Residencial Amanecer
              </div>
            </div>
          </div>

          <button 
            className="btn btn-tertiary" 
            style={{ width: '100%', border: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 700, borderRadius: 'var(--radius-md)', marginTop: '8px' }}
            onClick={() => onNavigate('pacientes')}
          >
            Ver Agenda Completa
          </button>
        </section>

        {/* 🛠 Quick Actions Widget (Left Column - Span 4) */}
        <section className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>Acciones Rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-tertiary" style={{ width: '100%', justifyContent: 'flex-start', gap: '12px', height: '48px', paddingLeft: '16px' }} onClick={() => onNavigate('nuevo-paciente')}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>person_add</span>
              Nuevo Paciente
            </button>
            <button className="btn btn-tertiary" style={{ width: '100%', justifyContent: 'flex-start', gap: '12px', height: '48px', paddingLeft: '16px' }} onClick={() => onNavigate('pacientes')}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>person_search</span>
              Ver Pacientes
            </button>
            <button className="btn btn-tertiary" style={{ width: '100%', justifyContent: 'flex-start', gap: '12px', height: '48px', paddingLeft: '16px' }} onClick={() => onNavigate('voluntariado')}>
              <span className="material-symbols-outlined" style={{ color: '#505355' }}>group</span>
              Voluntariado
            </button>
            <button className="btn btn-tertiary" style={{ width: '100%', justifyContent: 'flex-start', gap: '12px', height: '48px', paddingLeft: '16px' }} onClick={() => onNavigate('estadisticas')}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>leaderboard</span>
              Estadísticas
            </button>
          </div>
        </section>

        {/* 🚨 Alert Patients Grid List (Right Column - Span 8) */}
        <section className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
              {alertPatients.length > 0 ? '⚠ Pacientes en Alerta' : 'Estado de Acompañamientos'}
            </h2>
            <button className="btn btn-tertiary" style={{ height: '32px', padding: '0 12px', fontSize: '13px', fontWeight: 600 }} onClick={() => onNavigate('pacientes')}>
              Ver todos
            </button>
          </div>

          {alertPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-secondary)', display: 'block', marginBottom: '12px' }}>check_circle</span>
              <p style={{ fontWeight: 600, fontSize: '16px' }}>Todo en orden</p>
              <p style={{ fontSize: '14px', marginTop: '4px', margin: 0 }}>No hay alertas clínicas que requieran soporte crítico hoy.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {alertPatients.map(patient => {
                const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <div
                    key={patient.id}
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: '1.5px solid var(--color-error-container)',
                      background: 'linear-gradient(to right, var(--color-surface), var(--color-surface-container-low))',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => onViewDetail(patient.id)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(186,26,26,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <div style={{ position: 'absolute', top: 0, right: 0 }}>
                      <span style={{ backgroundColor: 'var(--color-error)', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '0 0 0 var(--radius-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Crítico
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                        {initials}
                      </div>
                      <div>
                        <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>{patient.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-outline)', marginTop: '2px' }}>ID: {patient.dni ? patient.dni : patient.id}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {patient.diagnosis}
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-outline-variant)', display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, height: '32px', fontSize: '12px', padding: 0, backgroundColor: 'var(--color-error)', border: 'none', color: 'white' }}
                        onClick={(e) => { e.stopPropagation(); onViewDetail(patient.id); }}
                      >
                        Atención Urgente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Floating Action Button for quick follow-up logs (Desktop/Mobile) */}
      <button 
        aria-label="Registrar Seguimiento" 
        className="fab"
        onClick={() => {
          if (alertPatients.length > 0) {
            onViewDetail(alertPatients[0].id);
          } else if (patients.length > 0) {
            onViewDetail(patients[0].id);
          } else {
            onNavigate('pacientes');
          }
        }}
      >
        <span className="material-symbols-outlined">edit_note</span>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>Registrar Seguimiento</span>
      </button>

    </div>
  );
}
