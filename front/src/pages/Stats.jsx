import React from 'react';
import { dbService } from '../services/db';
import { buildMonthlyHoursChart, sumFollowUpHours, toBarFillStyle } from '../utils/chartData';

export default function Stats() {
  const role = dbService.getRole() ?? 'volunteer';
  const isGlobal = role === 'admin' || role === 'coordinator';
  const userId = dbService.getCurrentUserId?.();
  const allFollowUps = dbService.getAllFollowUps();
  const followUps = isGlobal ? allFollowUps : allFollowUps.filter((item) => item.authorId === userId);
  const patients = dbService.getPatients();
  const stats = dbService.getStats()?.[isGlobal ? 'global' : 'personal'] ?? {};
  const monthlyData = buildMonthlyHoursChart(followUps, new Date());
  const totalHours = sumFollowUpHours(followUps, new Date().getFullYear());
  const patientsAttended = isGlobal ? new Set(followUps.map((item) => item.patientId)).size : Number(stats.patientsAttended ?? new Set(followUps.map((item) => item.patientId)).size);
  const metrics = isGlobal
    ? [{ label: 'Horas de acompañamiento', value: `${Number(stats.durationHours ?? totalHours).toFixed(1)} h` }, { label: 'Seguimientos registrados', value: Number(stats.visits ?? followUps.length) }, { label: 'Pacientes activos', value: Number(stats.activePatients ?? patients.length) }, { label: 'Alertas activas', value: Number(stats.activeAlerts ?? 0) }, { label: 'Voluntarios activos', value: Number(stats.activeVolunteers ?? dbService.getVolunteers().length) }]
    : [{ label: 'Horas de acompañamiento', value: `${totalHours} h` }, { label: 'Seguimientos registrados', value: followUps.length }, { label: 'Pacientes atendidos', value: patientsAttended }];

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
    <header><h1 style={{ color: 'var(--color-on-background)' }}>Estadísticas e impacto</h1><p style={{ color: 'var(--color-on-surface-variant)', marginTop: 4 }}>{isGlobal ? 'Resumen global calculado a partir de los datos registrados.' : 'Tu actividad calculada a partir de los seguimientos que registraste.'}</p></header>
    <section className="bento-grid" aria-label="Indicadores">
      {metrics.map((metric) => <article key={metric.label} className="card" style={{ gridColumn: 'span 4' }}><p style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>{metric.label}</p><strong style={{ display: 'block', fontSize: 30, marginTop: 8 }}>{metric.value}</strong></article>)}
    </section>
    <section id="monthly-activity-chart" className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h2 style={{ fontSize: 18, margin: 0 }}>Actividad mensual</h2><p style={{ color: 'var(--color-on-surface-variant)', margin: '4px 0 0' }}>Horas según la fecha local del dispositivo.</p></div>
      <div className="bar-chart bar-chart--monthly">{monthlyData.map((bar) => <div key={bar.label} className="bar-chart__column"><span className="bar-chart__value">{bar.value} h</span><div className="bar-chart__track"><div className="bar-chart__bar" data-hours={bar.value} style={{ '--bar-fill': toBarFillStyle(bar.fillPercent), backgroundColor: bar.active ? 'var(--color-primary)' : 'rgba(0, 90, 113, 0.15)' }} /></div><span className="bar-chart__label">{bar.label}</span></div>)}</div>
    </section>
    <section className="card"><h2 style={{ fontSize: 18 }}>Seguimientos recientes</h2>{followUps.length === 0 ? <p style={{ color: 'var(--color-on-surface-variant)' }}>No hay seguimientos para mostrar.</p> : <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}><thead><tr>{['Fecha', 'Paciente', 'Voluntario', 'Tipo', 'Duración'].map((label) => <th key={label} style={{ padding: 12 }}>{label}</th>)}</tr></thead><tbody>{followUps.slice(0, 20).map((item) => <tr key={item.id}><td style={{ padding: 12 }}>{new Date(item.occurredAt || item.date).toLocaleString('es-AR')}</td><td style={{ padding: 12 }}>{patients.find((patient) => patient.id === item.patientId)?.name || 'Paciente archivado'}</td><td style={{ padding: 12 }}>{item.authorName || 'Voluntario'}</td><td style={{ padding: 12 }}>{item.contactType}</td><td style={{ padding: 12 }}>{item.durationMinutes} min</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
