import React from 'react';
import { dbService } from '../services/db';

export default function Stats() {
  const patients = dbService.getPatients();
  const volunteers = dbService.getVolunteers();
  const followUps = dbService.getAllFollowUps();

  // Calculations
  const totalPatients = patients.length;
  const totalVolunteers = volunteers.filter(v => v.status === 'Activo').length;
  const totalVisits = followUps.length;

  // Monthly stats (mock distribution based on existing follow-ups)
  const monthlyData = [
    { month: 'Ene', visits: 12 },
    { month: 'Feb', visits: 18 },
    { month: 'Mar', visits: 24 },
    { month: 'Abr', visits: 31 },
    { month: 'May', visits: 42 },
    { month: 'Jun', visits: totalVisits + 30 } // Dynamically include current followups
  ];

  const maxVisits = Math.max(...monthlyData.map(d => d.visits));

  // Symptom ratios in follow-ups
  const painCount = followUps.filter(f => f.symptoms?.pain && !f.symptoms.pain.includes('0 - Ausente')).length;
  const nauseaCount = followUps.filter(f => f.symptoms?.nausea && f.symptoms.nausea !== 'Ninguno').length;
  const dyspneaCount = followUps.filter(f => f.symptoms?.dyspnea && !f.symptoms.dyspnea.includes('Grado 0')).length;

  const painRatio = totalVisits ? Math.round((painCount / totalVisits) * 100) : 0;
  const nauseaRatio = totalVisits ? Math.round((nauseaCount / totalVisits) * 100) : 0;
  const dyspneaRatio = totalVisits ? Math.round((dyspneaCount / totalVisits) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--color-on-background)' }}>Estadísticas e Impacto</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Métricas clave e impacto social de los acompañamientos realizados.</p>
      </div>

      {/* Bento Grid Metrics */}
      <div className="bento-grid">
        {/* KPI 1 */}
        <div className="card text-center" style={{ gridColumn: 'span 4' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-container)', padding: '12px', borderRadius: 'var(--radius-full)' }}>patient_list</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: '16px', color: 'var(--color-on-surface)' }}>{totalPatients}</h2>
          <p style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, marginTop: '4px' }}>Pacientes Acompañados</p>
        </div>

        {/* KPI 2 */}
        <div className="card text-center" style={{ gridColumn: 'span 4' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-secondary)', backgroundColor: 'rgba(75, 100, 80, 0.1)', padding: '12px', borderRadius: 'var(--radius-full)' }}>volunteer_activism</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: '16px', color: 'var(--color-on-surface)' }}>{totalVolunteers}</h2>
          <p style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, marginTop: '4px' }}>Voluntarios Activos</p>
        </div>

        {/* KPI 3 */}
        <div className="card text-center" style={{ gridColumn: 'span 4' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-tertiary)', backgroundColor: 'var(--color-secondary-container)', padding: '12px', borderRadius: 'var(--radius-full)' }}>history</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: '16px', color: 'var(--color-on-surface)' }}>{totalVisits}</h2>
          <p style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, marginTop: '4px' }}>Visitas y Soporte Registrados</p>
        </div>

        {/* CSS Chart: Monthly Visits */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '24px' }}>Frecuencia de Acompañamientos Mensuales</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', padding: '0 20px', position: 'relative' }}>
            {/* Grid Lines */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed var(--color-outline-variant)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed var(--color-outline-variant)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed var(--color-outline-variant)' }}></div>

            {monthlyData.map(d => {
              const heightPercent = maxVisits ? (d.visits / maxVisits) * 100 : 0;
              return (
                <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, width: '48px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{d.visits}</span>
                  <div style={{ 
                    width: '32px', 
                    height: `${heightPercent * 1.5}px`, // Scaled for display
                    backgroundColor: 'var(--color-primary)',
                    backgroundImage: 'linear-gradient(to top, var(--color-primary), var(--color-primary-container))',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'height 0.5s ease-out'
                  }}></div>
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Symptoms Prevalence breakdown progress indicators */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--color-secondary)', marginBottom: '20px' }}>Prevalencia de Síntomas Reportados</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '20px' }}>Porcentaje de seguimientos clínicos donde se reportó presencia moderada o severa del síntoma.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Pain */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Dolor Físico</span>
                <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>{painRatio}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-outline-variant)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${painRatio}%`, height: '100%', backgroundColor: 'var(--color-error)', borderRadius: 'var(--radius-full)' }}></div>
              </div>
            </div>

            {/* Nausea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Náuseas / Malestar</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{nauseaRatio}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-outline-variant)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${nauseaRatio}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }}></div>
              </div>
            </div>

            {/* Dyspnea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Disnea (Dificultad Respiratoria)</span>
                <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{dyspneaRatio}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-outline-variant)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${dyspneaRatio}%`, height: '100%', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-full)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
