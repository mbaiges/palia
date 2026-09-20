import React, { useEffect } from 'react';

export default function PrintReportPreview({ isOpen, onClose, patient, caregiver, followUps, getHospitalName }) {
  
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
          #print-preview-modal-root, #print-preview-modal-root * {
            visibility: visible;
          }
          #print-preview-modal-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
            background-color: white !important;
          }
          .no-print {
            display: none !important;
          }
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
    <div className="no-print" style={{
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
        <div className="no-print" style={{
          padding: '16px 24px',
          borderBottom: '1.5px solid var(--color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-container-low)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>print</span>
            <strong style={{ fontSize: '15px', color: 'var(--color-on-surface)' }}>Vista Previa de Impresión</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
          <div style={{
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

            <div style={{
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

            <div style={{
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
            </div>
          </section>

          {/* Section 3: History of Follow-up Visits */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1.5px solid var(--color-outline-variant)', paddingBottom: '6px' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>history</span>
              <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--color-primary)' }}>3. Historial de Visitas de Seguimiento</h2>
            </div>

            <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9ff', borderBottom: '1.5px solid var(--color-outline-variant)' }}>
                    <th style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '120px' }}>Fecha</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '150px' }}>Voluntario</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Resumen de Intervención</th>
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
                      <tr key={event.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <strong style={{ display: 'block' }}>{formatPrintDate(event.date)}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-outline)' }}>{formatPrintTime(event.date)}</span>
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', fontWeight: 600 }}>
                          {event.authorName}
                        </td>
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', lineHeight: '1.5', fontSize: '12px' }}>
                          {event.alertActivated && (
                            <span style={{ color: 'var(--color-error)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                              Situación Compleja / Alerta
                            </span>
                          )}
                          {event.symptomObservations}
                          {event.interventions && (
                            <div style={{ marginTop: '6px', color: 'var(--color-outline)' }}>
                              <strong>Intervenciones:</strong> {event.interventions}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
