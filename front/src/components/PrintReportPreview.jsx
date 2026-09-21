import React, { useEffect } from 'react';

export default function PrintReportPreview({ isOpen, onClose, patient, caregiver, followUps, alerts = [], getHospitalName }) {
  const display = (value) => value === null || value === undefined || value === '' ? 'No registrado' : value;
  const equipmentLabel = (item) => typeof item === 'string' ? item : item?.label ?? item?.name ?? item?.value ?? '';
  
  useEffect(() => {
    if (isOpen) {
      // Append printable-only styles to head dynamically to avoid polluting standard layout
      const style = document.createElement('style');
      style.id = 'print-report-preview-styles';
      style.innerHTML = `
        @media print {
          /* Hide app shell */
          body * {
            visibility: hidden;
            background: none !important;
            box-shadow: none !important;
          }
          #root * {
            visibility: hidden !important;
          }
          #print-preview-modal-root, #print-preview-modal-root * {
            visibility: visible !important;
          }
          #print-preview-modal-root {
            position: static;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            background-color: white !important;
          }
          .print-preview-overlay {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            background: none !important;
            backdrop-filter: none !important;
          }
          .print-preview-overlay > div {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            overflow: visible !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `;
      style.innerHTML += `
        @media screen and (max-width: 600px) {
          .print-preview-overlay { padding: 8px !important; align-items: stretch !important; }
          .print-preview-modal { height: 100% !important; max-height: 100% !important; border-radius: 12px !important; }
          .print-preview-toolbar { flex-wrap: wrap; gap: 12px; padding: 12px !important; }
          .print-preview-toolbar-title { flex: 1 1 100%; }
          .print-preview-toolbar-actions { width: 100%; }
          .print-preview-toolbar-actions > button { flex: 1 1 auto; min-width: 0; height: auto !important; min-height: 40px; padding: 8px !important; }
          #print-preview-modal-root { padding: 20px !important; min-width: 0; }
          .print-preview-clinical-header { flex-wrap: wrap; gap: 16px; }
          .print-preview-clinical-header > div:last-child { text-align: left !important; }
          .print-preview-data-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .print-preview-data-grid > div[style*="grid-column"] { grid-column: auto !important; }
          .print-preview-table-wrap { overflow-x: auto; max-width: 100%; }
          .print-preview-table { min-width: 620px; }
        }
      `;
      document.head.appendChild(style);
    } else {
      const existing = document.getElementById('print-report-preview-styles');
      if (existing) existing.remove();
    }
    return () => {
      const existing = document.getElementById('print-report-preview-styles');
      if (existing) existing.remove();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatPrintDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrintTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="print-preview-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '24px',
      boxSizing: 'border-box'
    }} onClick={onClose}>
      
      {/* Scrollable Container */}
      <div
        className="print-preview-modal"
        style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: '850px',
          height: '90%',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Action Toolbar */}
        <div className="no-print print-preview-toolbar" style={{
          padding: '16px 24px',
          borderBottom: '1.5px solid var(--color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-container-low)'
        }}>
          <div className="print-preview-toolbar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>print</span>
            <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>Vista Previa de Impresión</strong>
          </div>
          <div className="print-preview-toolbar-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
              Cerrar
            </button>
            <button className="btn btn-primary" onClick={handleTriggerPrint} style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div id="print-preview-modal-root" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px',
          backgroundColor: 'white',
          color: '#1a1c1e',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Clinical Header */}
          <div className="print-preview-clinical-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2.5px solid #1a1c1e',
            paddingBottom: '20px',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>PALIA</h1>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6f787d', fontWeight: 700 }}>Red de Acompañamiento Paliativo</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                border: '1.5px solid #d93025',
                color: '#d93025',
                padding: '4px 10px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                Historial Clínico - Confidencial
              </span>
              <p style={{ fontSize: '11px', color: '#6f787d', marginTop: '8px', margin: 0 }}>Fecha: {new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          {/* Section 1: Patient Data */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1.5px solid var(--color-outline-variant)', paddingBottom: '6px' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>person</span>
              <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--color-primary)' }}>1. Información del Paciente</h2>
            </div>

            <div className="print-preview-data-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              padding: '20px',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8f9ff',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Nombre Completo</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{patient?.name}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>DNI / ID</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{patient?.dni || '—'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Fecha de Nacimiento</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{patient?.dob} ({calculateAge(patient?.dob)} años)</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Hospital de Referencia</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{getHospitalName?.(patient?.hospitalId) || patient?.hospitalName || 'Sin hospital asignado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Estado de Seguimiento</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{patient?.currentStatus || 'No registrado'}</strong>
              </div>
              
              <div style={{ gridColumn: 'span 3' }}>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Diagnóstico Principal</span>
                <p style={{ margin: '4px 0 0 0', lineHeight: '1.4', fontStyle: 'italic' }}>{patient?.diagnosis}</p>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Dirección de Residencia</span>
                <p style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>{patient?.address}</p>
              </div>
            </div>
          </section>

          {/* Section 2: Caregiver Details */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1.5px solid var(--color-outline-variant)', paddingBottom: '6px' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>family_restroom</span>
              <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--color-primary)' }}>2. Contacto de Referencia / Cuidador</h2>
            </div>

            <div className="print-preview-data-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              padding: '20px',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Nombre Completo</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{caregiver?.name || '—'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Parentesco / Relación</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{caregiver?.relation || '—'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Teléfono de Contacto</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{caregiver?.phone || '—'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Convive con el paciente</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{caregiver?.livesWithPatient ? 'Sí' : caregiver?.livesWithPatient === false ? 'No' : 'No registrado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--color-outline)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Nivel de sobrecarga</span>
                <strong style={{ fontSize: '14px', color: '#1a1c1e' }}>{caregiver?.burdenLevel || 'No registrado'}</strong>
              </div>
            </div>
          </section>

          {/* Section 3: History of Follow-up Visits */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1.5px solid var(--color-outline-variant)', paddingBottom: '6px' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>history</span>
              <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--color-primary)' }}>3. Historial de Visitas de Seguimiento</h2>
            </div>

            <div className="print-preview-table-wrap" style={{ border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="print-preview-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9ff', borderBottom: '1.5px solid var(--color-outline-variant)' }}>
                    <th style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '120px' }}>Fecha</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '150px' }}>Voluntario</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Registro clínico completo</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-outline)' }}>
                        No se registraron seguimientos para este paciente.
                      </td>
                    </tr>
                  ) : (
                    followUps.map(event => (
                      <tr key={event.id} aria-label={`Seguimiento ${event.id}`} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <strong style={{ display: 'block' }}>{formatPrintDate(event.occurredAt || event.date)}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-outline)' }}>{formatPrintTime(event.occurredAt || event.date)}</span>
                          <span style={{ display: 'block', fontSize: '10px', marginTop: 6 }}>Confirmado: {formatPrintDate(event.recordedAt)} {formatPrintTime(event.recordedAt)}</span>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', fontWeight: 600 }}>
                          {event.authorName}
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', lineHeight: '1.5', fontSize: '12px' }}>
                          <div style={{ display: 'grid', gap: 5 }}>
                            <div><strong>Modalidad y duración:</strong> {display(event.contactType)} · {event.durationMinutes ? `${event.durationMinutes} min` : 'Duración no registrada'}</div>
                            <div><strong>Síntomas:</strong> Dolor {display(event.symptoms?.pain)} · Náuseas {display(event.symptoms?.nausea)} · Disnea {display(event.symptoms?.dyspnea)}</div>
                            <div><strong>Observaciones de síntomas:</strong> {display(event.symptomObservations)}</div>
                            <div><strong>Apoyo familiar:</strong> {display(event.socialRisk?.familySupport)}</div>
                            <div><strong>Notas del entorno:</strong> {display(event.socialRisk?.environmentNotes)}</div>
                            <div><strong>Equipamiento:</strong> {event.equipmentNeeds?.length ? event.equipmentNeeds.map(equipmentLabel).filter(Boolean).join(', ') : 'No registrado'}{event.equipmentOther ? ` · Otro: ${event.equipmentOther}` : ''}</div>
                            <div><strong>Intervenciones:</strong> {display(event.interventions)}</div>
                            {event.alert ? (
                              <div style={{ borderLeft: '3px solid #d93025', paddingLeft: 8, marginTop: 4 }}>
                                <strong>Alerta {event.alert.level === 'complex' ? 'compleja' : 'estándar'} · {event.alert.status === 'resolved' ? 'Resuelta' : 'Activa'}</strong>
                                <div><strong>Motivo:</strong> {display(event.alert.motive)}</div>
                                <div><strong>Observaciones clínicas:</strong> {display(event.alert.observations)}</div>
                                {event.alert.resolutionNote && <div><strong>Nota de resolución:</strong> {event.alert.resolutionNote}</div>}
                              </div>
                            ) : event.alertActivated ? <strong>Alerta registrada (detalle no disponible en esta respuesta).</strong> : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1.5px solid var(--color-outline-variant)', paddingBottom: '6px' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>warning</span>
              <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--color-primary)' }}>4. Historial de alertas clínicas</h2>
            </div>
            {alerts.length === 0 ? (
              <p>No se registraron alertas clínicas.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {alerts.map((alert) => (
                  <article key={alert.id} aria-label={`Alerta clínica ${alert.id}`} style={{ border: '1px solid var(--color-outline-variant)', borderLeft: `4px solid ${alert.status === 'active' ? '#d93025' : '#6f787d'}`, borderRadius: 'var(--radius-md)', padding: 12, fontSize: 12, lineHeight: 1.5 }}>
                    <strong>{alert.level === 'complex' ? 'Crisis Compleja' : 'Seguimiento Estándar'} · {alert.status === 'resolved' ? 'Resuelta' : 'Activa'}</strong>
                    <div><strong>Fecha:</strong> {formatPrintDate(alert.createdAt)} {formatPrintTime(alert.createdAt)}</div>
                    <div><strong>Motivo:</strong> {display(alert.motive)}</div>
                    <div><strong>Observaciones clínicas:</strong> {display(alert.observations)}</div>
                    <div><strong>Registrada por:</strong> {display(alert.authorName)}</div>
                    {alert.status === 'resolved' && <div><strong>Resolución:</strong> {formatPrintDate(alert.resolvedAt)} {formatPrintTime(alert.resolvedAt)} · {display(alert.resolvedByName)}{alert.resolutionNote ? ` · Nota: ${alert.resolutionNote}` : ''}</div>}
                  </article>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
