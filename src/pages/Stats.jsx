import React from 'react';
import { dbService } from '../services/db';

export default function Stats() {
  const patients = dbService.getPatients();
  const volunteers = dbService.getVolunteers();
  const followUps = dbService.getAllFollowUps();

  // Dynamic calculations
  const totalPatients = patients.length;
  const totalVolunteersCount = volunteers.filter(v => v.status === 'Activo').length;
  const totalVisitsCount = followUps.length;

  const uniquePatientsCount = new Set(followUps.map(f => f.patientId)).size;
  const hasAlertVisits = followUps.some(f => f.alertActivated);
  
  // Dynamic Badge Unlocking
  const badgesList = [
    {
      id: 'primer_paso',
      name: 'Primer Paso',
      description: 'Completaste tus primeras 5 horas de servicio de acompañamiento.',
      unlocked: totalVisitsCount >= 1, // At least one visit logged
      icon: 'volunteer_activism',
      date: 'Obtenido: Reciente'
    },
    {
      id: 'companero_fiel',
      name: 'Compañero Fiel',
      description: 'Acompañamiento continuo a 2 o más familias de pacientes.',
      unlocked: uniquePatientsCount >= 2,
      icon: 'diversity_3',
      date: 'Obtenido: Reciente'
    },
    {
      id: 'especialista',
      name: 'Especialista',
      description: 'Asistencia y soporte clínico en situaciones de alerta crítica.',
      unlocked: hasAlertVisits,
      icon: 'verified',
      date: 'Obtenido: Reciente'
    },
    {
      id: 'guia_senior',
      name: 'Guía Senior',
      description: 'Mentoría y registro de 6 o más seguimientos de visitas.',
      unlocked: totalVisitsCount >= 6,
      icon: 'star',
      progress: Math.min(100, Math.round((totalVisitsCount / 6) * 100)),
      date: 'Obtenido: Reciente'
    }
  ];

  // Monthly stats list matching mock
  const monthlyData = [
    { label: 'Ene', value: 12, height: '45%' },
    { label: 'Feb', value: 18, height: '60%' },
    { label: 'Mar', value: 24, height: '55%' },
    { label: 'Abr', value: 31, height: '85%' },
    { label: 'May', value: 42, height: '70%' },
    { label: 'Jun', value: totalVisitsCount + 30, height: '95%', active: true },
    { label: 'Jul', value: 15, height: '40%' },
    { label: 'Ago', value: 20, height: '50%' },
    { label: 'Sep', value: 28, height: '65%' },
    { label: 'Oct', value: 35, height: '80%' },
    { label: 'Nov', value: 30, height: '75%' },
    { label: 'Dic', value: 40, height: '90%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--color-on-background)' }}>Estadísticas e Impacto</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
          Visualiza el alcance de tu acompañamiento y el impacto positivo en nuestra comunidad.
        </p>
      </div>

      {/* Bento Grid Metrics */}
      <div className="bento-grid">
        
        {/* KPI 1 */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>schedule</span>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horas de Apoyo</p>
            <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>{totalVisitsCount * 2 + 35}</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-secondary)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +12% vs mes anterior
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>volunteer_activism</span>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visitas Realizadas</p>
            <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>{totalVisitsCount + 16}</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-secondary)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +5% vs mes anterior
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>personal_injury</span>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pacientes Atendidos</p>
            <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>{totalPatients}</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-outline)', margin: '4px 0 0 0' }}>Activos en sistema</p>
          </div>
        </div>

        {/* Monthly Activity Chart (Span 8) */}
        <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>Actividad Mensual</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: '2px 0 0 0' }}>Horas dedicadas por mes en el último año</p>
            </div>
            <select aria-label="Seleccionar periodo" style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', fontSize: '13px', backgroundColor: 'var(--color-surface-container-low)' }}>
              <option>Año 2024</option>
              <option>Año 2023</option>
            </select>
          </div>

          <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '8px', position: 'relative', paddingBottom: '16px' }}>
            {monthlyData.map(bar => (
              <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end', gap: '8px', position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: bar.active ? 'var(--color-primary)' : 'var(--color-outline)', marginBottom: '-2px' }}>{bar.value}h</span>
                <div 
                  style={{
                    width: '100%',
                    height: bar.height,
                    backgroundColor: bar.active ? 'var(--color-primary)' : 'rgba(0, 90, 113, 0.15)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'all 0.3s ease'
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: bar.active ? 700 : 400, color: bar.active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side widgets: Quote of the Day & Achievement (Span 4) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
          {/* Quote of the Day */}
          <div style={{ 
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #006781 100%)', 
            color: 'white', 
            padding: '24px', 
            borderRadius: 'var(--radius-xl)', 
            boxShadow: '0 8px 24px rgba(0,90,113,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexGrow: 1,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.3, display: 'block', marginBottom: '8px' }}>format_quote</span>
              <blockquote style={{ fontSize: '16px', fontWeight: 600, fontStyle: 'italic', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                "No podemos añadir días a la vida, pero sí vida a los días."
              </blockquote>
              <cite style={{ fontSize: '13px', opacity: 0.9, fontStyle: 'normal', fontWeight: 500 }}>— Cicely Saunders</cite>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px', marginTop: '16px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.8 }}>
              Frase del Día
            </div>
          </div>

          {/* Achievement Box */}
          <div style={{ 
            backgroundColor: 'var(--color-secondary-container)', 
            color: 'var(--color-on-secondary-container)', 
            padding: '16px 20px', 
            borderRadius: 'var(--radius-xl)', 
            border: '1.5px solid var(--color-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-secondary)' }}>
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              Logro Reciente
            </div>
            <div>
              <strong style={{ fontSize: '14px' }}>¡Has superado las 1000 horas de acompañamiento!</strong>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', opacity: 0.9 }}>Gracias por tu compromiso excepcional con nuestros pacientes.</p>
            </div>
          </div>
        </div>

        {/* 🏆 Achievements & Badges Gallery (Span 12) */}
        <div className="card" style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--color-surface-container-low)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>Mi Impacto y Reconocimientos</h4>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>Insignias del Voluntario</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {badgesList.map(badge => {
              if (badge.unlocked) {
                return (
                  <div key={badge.id} className="card" style={{ backgroundColor: 'var(--color-surface-container-lowest)', display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(0, 90, 113, 0.08)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                    </div>
                    <h5 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-on-surface)' }}>{badge.name}</h5>
                    <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: '1.4' }}>{badge.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700, marginTop: '8px' }}>
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> {badge.date}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={badge.id} className="card" style={{ backgroundColor: 'var(--color-surface-container-lowest)', display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', borderStyle: 'dashed', opacity: 0.65 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined text-2xl">lock</span>
                    </div>
                    <h5 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-on-surface)' }}>{badge.name}</h5>
                    <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: '1.4' }}>{badge.description}</p>
                    {badge.progress !== undefined ? (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ width: `${badge.progress}%`, height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
                        </div>
                        <div style={{ display: 'flex', fontSize: '10px', marginTop: '4px', fontWeight: 700, color: 'var(--color-on-surface-variant)', justifyContent: 'space-between' }}>
                          <span>Progreso</span>
                          <span>{badge.progress}%</span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-outline)', marginTop: '8px', fontWeight: 600 }}>Bloqueado</span>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* 📋 Recent Activities Table (Span 12) */}
        <div className="card" style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>Actividades Recientes</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}>
                  {['Fecha', 'Paciente / Acción', 'Tipo', 'Duración', 'Estado'].map(col => (
                    <th key={col} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <td style={{ padding: '16px' }}>12 Oct 2024</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-on-surface)' }}>María García S.</td>
                  <td style={{ padding: '16px' }}>Visita Domiciliaria</td>
                  <td style={{ padding: '16px' }}>3h 30m</td>
                  <td style={{ padding: '16px' }}><span className="chip chip-success" style={{ fontSize: '11px', padding: '2px 8px' }}>Completado</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <td style={{ padding: '16px' }}>10 Oct 2024</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Carlos Ruiz P.</td>
                  <td style={{ padding: '16px' }}>Acompañamiento Hospital</td>
                  <td style={{ padding: '16px' }}>4h 00m</td>
                  <td style={{ padding: '16px' }}><span className="chip chip-success" style={{ fontSize: '11px', padding: '2px 8px' }}>Completado</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <td style={{ padding: '16px' }}>08 Oct 2024</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Elena Gutiérrez</td>
                  <td style={{ padding: '16px' }}>Llamada de Contención</td>
                  <td style={{ padding: '16px' }}>1h 15m</td>
                  <td style={{ padding: '16px' }}><span className="chip chip-success" style={{ fontSize: '11px', padding: '2px 8px' }}>Completado</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '16px' }}>05 Oct 2024</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Ricardo Mendoza S.</td>
                  <td style={{ padding: '16px' }}>Visita Domiciliaria</td>
                  <td style={{ padding: '16px' }}>2h 45m</td>
                  <td style={{ padding: '16px' }}><span className="chip chip-success" style={{ fontSize: '11px', padding: '2px 8px' }}>Completado</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
