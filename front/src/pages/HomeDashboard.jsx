import React from 'react';
import { dbService } from '../services/db';
import { buildWeeklyVisitsChart, filterFollowUpsByPeriod, toBarFillStyle } from '../utils/chartData';

export default function HomeDashboard({ user, onNavigate, onViewDetail }) {
  const patients = dbService.getPatients();
  const followUps = dbService.getAllFollowUps();
  const alerts = dbService.getAlerts().filter((alert) => alert.status === 'active');
  const role = dbService.getRole() ?? user?.role ?? 'volunteer';
  const isGlobal = role === 'admin' || role === 'coordinator';
  const visiblePatients = isGlobal ? patients : patients.filter((patient) => patient.assignedVolunteers?.includes(user?.id));
  const visibleFollowUps = isGlobal ? followUps : followUps.filter((followUp) => followUp.authorId === user?.id);
  const visibleAlerts = isGlobal ? alerts : alerts.filter((alert) => visiblePatients.some((patient) => patient.id === alert.patientId));
  const now = new Date();
  const weekVisits = filterFollowUpsByPeriod(visibleFollowUps, now, 7);
  const chart = buildWeeklyVisitsChart(visibleFollowUps, now, 7);
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const name = user?.displayName?.split(' ')[0] || 'equipo';
  const assignedCount = visiblePatients.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #006781 100%)', borderRadius: 'var(--radius-xl)', padding: '32px', color: 'white' }}>
        <p style={{ margin: '0 0 6px', textTransform: 'capitalize' }}>{now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <h1 style={{ color: 'white', margin: 0 }}>{greeting}, {name}</h1>
        <p style={{ marginBottom: 0 }}>{visibleAlerts.length ? `${visibleAlerts.length} alerta${visibleAlerts.length === 1 ? '' : 's'} activa${visibleAlerts.length === 1 ? '' : 's'} en el directorio.` : 'No hay alertas activas.'}</p>
      </section>

      <div className="bento-grid">
        <section className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--color-primary)', margin: 0 }}>Actividad de los últimos 7 días</h2>
          <div className="stat-cards-grid">
            <div className="stat-card"><div style={{ fontSize: '28px', fontWeight: 800 }}>{weekVisits.length}</div><div className="stat-card__label">Seguimientos registrados</div></div>
            <div className="stat-card"><div style={{ fontSize: '28px', fontWeight: 800 }}>{assignedCount}</div><div className="stat-card__label">{isGlobal ? 'Pacientes activos' : 'Pacientes asignados'}</div></div>
            <div className="stat-card"><div style={{ fontSize: '28px', fontWeight: 800 }}>{visibleAlerts.length}</div><div className="stat-card__label">Alertas activas</div></div>
          </div>
          <div className="bar-chart bar-chart--weekly">
            {chart.map((bar) => <div key={bar.label} className="bar-chart__column"><div className="bar-chart__track"><div title={`${bar.label}: ${bar.value} seguimientos`} className="bar-chart__bar" style={{ '--bar-fill': toBarFillStyle(bar.fillPercent), backgroundColor: bar.active ? 'var(--color-primary)' : 'rgba(0, 90, 113, 0.2)' }} /></div><span className="bar-chart__label">{bar.label}</span></div>)}
          </div>
        </section>

        <section className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Alertas activas</h2>
          {visibleAlerts.length === 0 ? <p style={{ color: 'var(--color-on-surface-variant)' }}>No hay alertas activas.</p> : visibleAlerts.slice(0, 4).map((alert) => <button key={alert.id} className="btn btn-tertiary" onClick={() => onViewDetail(alert.patientId)} style={{ justifyContent: 'space-between', textAlign: 'left' }}><span>{alert.patientName || visiblePatients.find((patient) => patient.id === alert.patientId)?.name || 'Paciente'}</span><span>{alert.level === 'complex' ? 'Crítica' : 'Seguimiento'}</span></button>)}
          <button className="btn btn-secondary" onClick={() => onNavigate('pacientes')}>Abrir directorio</button>
        </section>

        <section className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Acciones</h2>
          <button className="btn btn-tertiary" onClick={() => onNavigate('pacientes')}>Ver directorio de pacientes</button>
          {isGlobal && <button className="btn btn-tertiary" onClick={() => onNavigate('voluntariado')}>Voluntariado</button>}
          <button className="btn btn-tertiary" onClick={() => onNavigate('estadisticas', { sectionId: 'monthly-activity-chart' })}>Estadísticas</button>
        </section>

        <section className="card" style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontSize: '18px', margin: 0 }}>Seguimientos recientes</h2><button className="btn btn-tertiary" onClick={() => onNavigate('pacientes')}>Ver directorio</button></div>
          {visibleFollowUps.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', padding: '24px' }}>Todavía no hay seguimientos registrados.</p> : <div className="table-scroll"><table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>Fecha</th><th>Paciente</th><th>Tipo</th><th>Duración</th></tr></thead><tbody>{visibleFollowUps.slice(0, 5).map((followUp) => { const patient = patients.find((item) => item.id === followUp.patientId); return <tr key={followUp.id}><td>{new Date(followUp.occurredAt || followUp.date).toLocaleString('es-AR')}</td><td><button className="btn btn-tertiary" onClick={() => onViewDetail(followUp.patientId)}>{patient?.name || 'Paciente archivado'}</button></td><td>{followUp.contactType}</td><td>{followUp.durationMinutes} min</td></tr>; })}</tbody></table></div>}
        </section>
      </div>
    </div>
  );
}
