import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';

export default function Administration({ initialTab, onTabConsumed }) {
  const [patients, setPatients] = useState(dbService.getPatients());
  const [volunteers, setVolunteers] = useState(dbService.getVolunteers());
  const [hospitals, setHospitals] = useState(dbService.getHospitals());
  const [invitations, setInvitations] = useState(dbService.getInvitations());

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tabs: 'asignacion' | 'invitaciones'
  const [activeSubTab, setActiveSubTab] = useState(initialTab || 'asignacion');

  // Consume the initialTab prop if set externally (deep-link)
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
      if (onTabConsumed) onTabConsumed();
    }
  }, [initialTab]);

  // Volunteer Assignment form states
  const [assignPatientId, setAssignPatientId] = useState(patients[0]?.id || '');
  const [assignVolId, setAssignVolId] = useState(volunteers[0]?.id || '');
  const [assignMsg, setAssignMsg] = useState('');

  // Hospital Form states
  const [newHospName, setNewHospName] = useState('');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [hospMsg, setHospMsg] = useState('');

  // Invitation Form states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Voluntario');
  const [inviteMsg, setInviteMsg] = useState('');

  // Action Handlers
  const handleAssign = (e) => {
    e.preventDefault();
    if (!assignPatientId || !assignVolId) return;

    try {
      dbService.assignVolunteerToPatient(assignPatientId, assignVolId);
      setPatients(dbService.getPatients());
      setAssignMsg('Asignación realizada con éxito.');
      setTimeout(() => setAssignMsg(''), 3000);
    } catch (err) {
      setAssignMsg('Error: ' + err.message);
    }
  };

  const handleAddHospital = (e) => {
    e.preventDefault();
    if (!newHospName.trim() || !newHospAddress.trim()) return;

    try {
      dbService.saveHospital({ name: newHospName.trim(), address: newHospAddress.trim() });
      setHospitals(dbService.getHospitals());
      setNewHospName('');
      setNewHospAddress('');
      setHospMsg('Hospital agregado con éxito.');
      setTimeout(() => setHospMsg(''), 3000);
    } catch (err) {
      setHospMsg('Error: ' + err.message);
    }
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    try {
      dbService.saveInvitation({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        status: 'Pendiente'
      });
      setInvitations(dbService.getInvitations());
      setInviteName('');
      setInviteEmail('');
      setInviteMsg('Invitación enviada con éxito.');
      setTimeout(() => setInviteMsg(''), 3000);
    } catch (err) {
      setInviteMsg('Error: ' + err.message);
    }
  };

  const handleRevokeInvite = (id) => {
    dbService.revokeInvitation(id);
    setInvitations(dbService.getInvitations());
  };

  const handleDeleteInvite = (id) => {
    dbService.deleteInvitation(id);
    setInvitations(dbService.getInvitations());
  };

  const handleResendInvite = (invite) => {
    alert(`Invitación reenviada a ${invite.name} (${invite.email})`);
  };

  const getVolunteerNames = (ids) => {
    if (!ids || ids.length === 0) return 'Ninguno asignado';
    return ids.map(id => {
      const v = volunteers.find(vol => vol.id === id);
      return v ? v.name : id;
    }).join(', ');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'UI';
  };

  const pendingInvitesCount = invitations.filter(inv => inv.status === 'Pendiente').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'var(--color-on-background)', margin: 0 }}>Panel de Administración</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px', margin: 0 }}>
            Gestión interna, asignaciones de voluntarios, catálogo de centros e invitaciones.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeSubTab === 'asignacion' ? 'btn-primary' : 'btn-tertiary'}`}
          onClick={() => setActiveSubTab('asignacion')}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          Asignación y Centros
        </button>
        <button
          className={`btn ${activeSubTab === 'invitaciones' ? 'btn-primary' : 'btn-tertiary'}`}
          onClick={() => setActiveSubTab('invitaciones')}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          Invitaciones y Accesos
        </button>
      </div>

      {/* Subtab 1: Asignacion y Centros */}
      {activeSubTab === 'asignacion' && (
        <div className="bento-grid">
          {/* Left Column: Volunteer Assignment */}
          <div className="card" style={{ gridColumn: isMobile ? 'span 12' : 'span 6', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>handshake</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Asignación de Voluntarios</h2>
            </div>

            <form onSubmit={handleAssign} className="form-section">
              <div className="form-group">
                <label>Seleccionar Paciente</label>
                <select value={assignPatientId} onChange={(e) => setAssignPatientId(e.target.value)}>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.dni})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Seleccionar Voluntario</label>
                <select value={assignVolId} onChange={(e) => setAssignVolId(e.target.value)}>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.status})</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" type="submit" style={{ marginTop: '8px' }}>
                <span className="material-symbols-outlined">link</span>
                Asignar Acompañante
              </button>
              {assignMsg && (
                <p style={{ marginTop: '12px', color: 'var(--color-primary)', fontWeight: 700, margin: 0 }}>{assignMsg}</p>
              )}
            </form>

            {/* Current Assignments Table */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px', fontWeight: 700 }}>Listado de Asignaciones Activas</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>Paciente</th>
                      <th style={{ padding: '8px 4px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>Voluntarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '10px 4px', color: 'var(--color-primary)', fontWeight: 500 }}>{getVolunteerNames(p.assignedVolunteers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Hospital Management */}
          <div className="card" style={{ gridColumn: isMobile ? 'span 12' : 'span 6', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-secondary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'rgba(75, 100, 80, 0.1)', color: 'var(--color-secondary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>domain</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Centros de Salud de Derivación</h2>
            </div>

            {/* List of Hospitals */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
              {hospitals.map(h => (
                <div key={h.id} style={{ borderBottom: '1px dashed var(--color-outline-variant)', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>{h.name}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>{h.address}</span>
                </div>
              ))}
            </div>

            {/* Add Hospital Form */}
            <form onSubmit={handleAddHospital} className="form-section" style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px', fontWeight: 700 }}>Registrar Nuevo Centro</h3>
              <div className="form-group">
                <label>Nombre del Centro *</label>
                <input
                  type="text"
                  placeholder="Ej: Hospital Clínico San Carlos"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dirección / Ubicación *</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Córdoba 2351, CABA, Argentina"
                  value={newHospAddress}
                  onChange={(e) => setNewHospAddress(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-secondary" type="submit" style={{ marginTop: '8px' }}>
                <span className="material-symbols-outlined">add</span>
                Agregar Hospital
              </button>
              {hospMsg && (
                <p style={{ marginTop: '12px', color: 'var(--color-secondary)', fontWeight: 700, margin: 0 }}>{hospMsg}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Subtab 2: Invitaciones y Accesos (Screen 10 parity) */}
      {activeSubTab === 'invitaciones' && (
        <div className="bento-grid">
          {/* Left Column: Form + License Stats (col-span-4) */}
          <div style={{ gridColumn: isMobile ? 'span 12' : 'span 4', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
            
            {/* Invite Form Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
                <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>person_add</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Enviar Invitación</h2>
              </div>

              <form onSubmit={handleSendInvite} className="form-section">
                <div className="form-group">
                  <label>Nombre del Invitado *</label>
                  <input
                    type="text"
                    placeholder="Ej: Ana García"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    placeholder="ana.garcia@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rol en la Organización</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="Voluntario">Voluntario</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
                  <span>Enviar Invitación</span>
                  <span className="material-symbols-outlined">send</span>
                </button>
                {inviteMsg && (
                  <p style={{ marginTop: '12px', color: 'var(--color-primary)', fontWeight: 700, margin: 0, textAlign: 'center' }}>{inviteMsg}</p>
                )}
              </form>
            </div>

            {/* License Stats Card */}
            <div style={{
              backgroundColor: 'var(--color-secondary-container)',
              color: 'var(--color-on-secondary-container)',
              padding: '20px 24px',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid var(--color-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, margin: 0, opacity: 0.8 }}>Cupos Disponibles</p>
                <p style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>24 Licencias</p>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>verified_user</span>
              </div>
            </div>

          </div>

          {/* Right Column: Active Invitations Table/Cards List (col-span-8) */}
          <div className="card" style={{ gridColumn: isMobile ? 'span 12' : 'span 8', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>Invitaciones Activas</h3>
              <span className="chip chip-info" style={{ fontSize: '12px' }}>{pendingInvitesCount} Pendientes</span>
            </div>

            {isMobile ? (
              /* MOBILE VERTICAL CARD ITEMS */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invitations.map(inv => {
                  const isPending = inv.status === 'Pendiente';
                  const isRegistered = inv.status === 'Registrado';
                  const isExpired = inv.status === 'Expirado';

                  return (
                    <div 
                      key={inv.id} 
                      className="card" 
                      style={{ 
                        padding: '16px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        border: '1px solid var(--color-outline-variant)',
                        opacity: isExpired ? 0.7 : 1,
                        background: 'linear-gradient(to right, var(--color-surface), var(--color-surface-container-low))'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isExpired ? 'var(--color-surface-container-highest)' : 'var(--color-secondary-container)', color: isExpired ? 'var(--color-outline)' : 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {getInitials(inv.name)}
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>{inv.name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--color-outline)', marginTop: '2px' }}>{inv.email}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <span 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                backgroundColor: isPending ? 'var(--color-primary)' : isRegistered ? 'var(--color-secondary)' : 'var(--color-error)' 
                              }} 
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: isPending ? 'var(--color-primary)' : isRegistered ? 'var(--color-secondary)' : 'var(--color-error)' }}>
                              {inv.status} ({inv.role})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {isPending && (
                          <>
                            <button className="icon-btn" title="Reenviar" onClick={() => handleResendInvite(inv)}>
                              <span className="material-symbols-outlined">sync</span>
                            </button>
                            <button className="icon-btn" title="Revocar" style={{ color: 'var(--color-error)' }} onClick={() => handleRevokeInvite(inv.id)}>
                              <span className="material-symbols-outlined">cancel</span>
                            </button>
                          </>
                        )}
                        {isRegistered && (
                          <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)', padding: '8px' }}>check_circle</span>
                        )}
                        {isExpired && (
                          <>
                            <button className="icon-btn" title="Reenviar" onClick={() => handleResendInvite(inv)}>
                              <span className="material-symbols-outlined">sync</span>
                            </button>
                            <button className="icon-btn" title="Eliminar" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteInvite(inv.id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DESKTOP DATA TABLE */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>Invitado</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>Fecha Envío</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>Estado</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => {
                      const isPending = inv.status === 'Pending' || inv.status === 'Pendiente';
                      const isRegistered = inv.status === 'Registered' || inv.status === 'Registrado';
                      const isExpired = inv.status === 'Expired' || inv.status === 'Expirado';

                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-outline-variant)', opacity: isExpired ? 0.7 : 1 }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isExpired ? 'var(--color-surface-container-highest)' : 'var(--color-primary-container)', color: isExpired ? 'var(--color-outline)' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                                {getInitials(inv.name)}
                              </div>
                              <strong style={{ color: 'var(--color-on-surface)' }}>{inv.name}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--color-on-surface-variant)' }}>{inv.email}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--color-on-surface-variant)' }}>{inv.date}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`chip ${isPending ? 'chip-warning' : isRegistered ? 'chip-success' : 'chip-error'}`} style={{ fontSize: '11px' }}>
                              {inv.status} ({inv.role})
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            {isPending && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                <button className="icon-btn" title="Reenviar" onClick={() => handleResendInvite(inv)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
                                </button>
                                <button className="icon-btn" title="Revocar" style={{ color: 'var(--color-error)' }} onClick={() => handleRevokeInvite(inv.id)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                                </button>
                              </div>
                            )}
                            {isRegistered && (
                              <button className="icon-btn" title="Ver Perfil" style={{ color: 'var(--color-primary)' }} onClick={() => alert(`Perfil de ${inv.name} (${inv.role})`)}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                              </button>
                            )}
                            {isExpired && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                <button className="icon-btn" title="Reenviar" onClick={() => handleResendInvite(inv)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
                                </button>
                                <button className="icon-btn" title="Eliminar" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteInvite(inv.id)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
