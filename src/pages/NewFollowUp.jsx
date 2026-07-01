import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Patients({ onViewDetail, onNewPatient, searchVal }) {
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [localQuery, setLocalQuery] = useState('');

  const patients = dbService.getPatients();
  const hospitals = dbService.getHospitals();

  const getHospitalName = (id) => {
    const h = hospitals.find(hosp => hosp.id === id);
    return h ? h.name : 'No asignado';
  };

  // Combine parent search value (from Header) and local filters
  const filteredPatients = patients.filter(p => {
    const query = (searchVal || localQuery || '').toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(query) || 
                         p.diagnosis.toLowerCase().includes(query) ||
                         p.dni.toLowerCase().includes(query);
                         
    const matchesStatus = filterStatus === 'Todos' || 
                         (filterStatus === 'Estable' && p.currentStatus === 'Estable') ||
                         (filterStatus === 'En Observación' && p.currentStatus === 'En Observación') ||
                         (filterStatus === 'Alerta' && p.currentStatus === 'Alerta');

    return matchesQuery && matchesStatus;
  });

  const getStatusChipClass = (status) => {
    switch (status) {
      case 'Estable': return 'chip-success';
      case 'En Observación': return 'chip-warning';
      case 'Alerta': return 'chip-error';
      default: return 'chip-info';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* Side Navigation */}
      <aside className="hidden md:block w-64 h-screen bg-surface fixed left-0 top-0 flex flex-col py-4 border-r border-outline-variant">
        <div className="px-6 mb-4">
          <h1 className="text-headline-md font-headline-md font-bold text-primary">PaliativoCare</h1>
          <p className="text-label-md font-label-md text-outline">Gestión de Acompañamiento</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-lg text-label-lg">Inicio</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary font-bold border-r-4 border-primary bg-surface-container-low transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">person_search</span>
            <span className="font-label-lg text-label-lg">Pacientes</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-lg text-label-lg">Voluntariado</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="font-label-lg text-label-lg">Estadísticas</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-lg text-label-lg">Administración</span>
          </a>
        </nav>
        <div className="px-3 mt-auto space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-lg text-label-lg">Configuración</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-error font-medium hover:bg-error-container transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-lg text-label-lg">Cerrar Sesión</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 sticky top-0 w-full bg-surface border-b border-outline-variant flex justify-between items-center px-margin-desktop z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Buscar paciente por nombre o DNI..." type="text" value={localQuery} onChange={e => setLocalQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant relative transition-colors duration-200">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors duration-200">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-outline-variant">
              <div className="text-right">
                <p className="text-label-lg font-label-lg text-on-surface">Dr. Manuel García</p>
                <p className="text-label-md font-label-md text-outline">Administrador</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5ci0UzmaOD8V4cF-_JtA491MezO6Z_4xlf89u_J72q7cexVsKL1DMBMrFE9g4Z440qqaPGBGJNttuNExhmx-bUkcfY_Nv7c0Kcmsych7LfUPWXc9qzkZqAXYo6HM6DMpk3ulo2RptMfwdFP-vgx5QcmvQhYKuRf-Twy8VUKu8EI2_u5muhzXXOKVqYdfcD_6C2-DXwuQzLGqLDDeTv_2B8uMoJNDZ7v8o7pzlCFcre12tn59LqFW3JikvgALq0LwxmfpxDxpWUr8" alt="profile" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-margin-desktop flex-1 overflow-y-auto">
          {/* Header & Add Button */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Directorio de Pacientes</h2>
              <p className="text-body-lg font-body-lg text-outline">Gestiona y supervisa el estado de todos los pacientes asignados.</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-lg hover:shadow-lg transition-all active:scale-95" onClick={onNewPatient}>
              <span className="material-symbols-outlined">person_add</span>
              Añadir Nuevo Paciente
            </button>
          </div>

          {/* Statistic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button className="p-4 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low transition-all group active:scale-95">
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined p-2 bg-surface-container-high rounded-lg text-primary">groups</span>
                <span className="text-headline-sm font-headline-sm">124</span>
              </div>
              <p className="text-label-lg font-label-lg text-on-surface">Todos los Pacientes</p>
              <div className="w-full h-1 bg-surface-container-high mt-4 rounded-full"><div className="w-full h-full bg-primary"></div></div>
            </button>
            <button className="p-4 bg-error-container border border-error/20 rounded-xl hover:bg-error-container/80 active:scale-95">
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined p-2 bg-error text-on-error rounded-lg">priority_high</span>
                <span className="text-headline-sm font-headline-sm text-on-error-container">8</span>
              </div>
              <p className="text-label-lg font-label-lg text-on-error-container">Situación Crítica</p>
              <div className="w-full h-1 bg-on-error-container/20 mt-4 rounded-full"><div className="w-[15%] h-full bg-error"></div></div>
            </button>
            <button className="p-4 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low active:scale-95">
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined p-2 bg-secondary-container text-on-secondary-container rounded-lg">warning</span>
                <span className="text-headline-sm font-headline-sm text-secondary">24</span>
              </div>
              <p className="text-label-lg font-label-lg text-on-surface">Alertas Activas</p>
              <div className="w-full h-1 bg-secondary-container mt-4 rounded-full"><div className="w-[30%] h-full bg-secondary"></div></div>
            </button>
            <button className="p-4 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low active:scale-95">
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined p-2 bg-surface-container-highest text-primary rounded-lg">check_circle</span>
                <span className="text-headline-sm font-headline-sm text-on-surface">92</span>
              </div>
              <p className="text-label-lg font-label-lg text-on-surface">Estables</p>
              <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full"><div className="w-[75%] h-full bg-primary-container"></div></div>
            </button>
          </div>

          {/* Patients Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant">Paciente</th>
                    <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant">DNI / ID</th>
                    <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant">Estado</th>
                    <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant">Cuidador / Familiar</th>
                    <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant">Última Visita</th>
                    <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredPatients.map(patient => {
                    const isAlert = patient.currentStatus === 'Alerta';
                    return (
                      <tr key={patient.id} className="hover:bg-surface-container-low transition-colors duration-150">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full" style={{backgroundColor: isAlert ? 'var(--color-error-container)' : 'var(--color-secondary-container)', color: isAlert ? 'var(--color-error)' : 'var(--color-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>{getInitials(patient.name)}</div>
                            <div>
                              <p className="font-label-lg text-label-lg text-on-surface">{patient.name}</p>
                              <p className="text-label-md font-label-md text-outline">{patient.diagnosis}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-body-md font-body-md text-on-surface">{patient.dni}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${isAlert ? 'bg-error text-on-error' : patient.currentStatus === 'Estable' ? 'bg-primary-container text-on-primary-container' : patient.currentStatus === 'En Observación' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface'}`}> 
                            {isAlert ? (
                              <>
                                <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>priority_high</span>
                                Situación compleja
                              </>
                            ) : (
                              <>{patient.currentStatus}</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-label-md text-label-md text-on-surface">{patient.caregiverName}</p>
                          <p className="text-label-md font-label-md text-outline">{patient.caregiverPhone}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-label-md text-label-md text-on-surface">{patient.lastVisit}</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 hover:bg-surface-container rounded-lg text-primary" onClick={() => onViewDetail(patient.id)}>
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant">
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function NewFollowUp({ patientId, onCancel, onSaveSuccess }) {
  const patient = dbService.getPatient(patientId);

  // Form states
  const [alertActivated, setAlertActivated] = useState(false);
  const [contactType, setContactType] = useState('Presencial');
  
  // Symptoms (Dropdown Selects)
  const [symptoms, setSymptoms] = useState({
    dolor: 'Ausente',
    nauseas: 'Ausente',
    disnea: 'Ausente',
    insomnio: 'Ausente',
    ansiedad: 'Ausente'
  });
  const [distress, setDistress] = useState(0);
  const [symptomObservations, setSymptomObservations] = useState('');

  // Social Risk
  const [familySupport, setFamilySupport] = useState('Sólido y constante');
  const [environmentNotes, setEnvironmentNotes] = useState('');

  // Equipment Needs
  const [equipmentList, setEquipmentList] = useState({
    oxigeno: 'No requiere',
    cama: 'No requiere',
    silla: 'No requiere',
    aspirador: 'No requiere'
  });

  // Interventions
  const [interventions, setInterventions] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptomObservations || !interventions) {
      setErrorMsg('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    setIsSaving(true);

    const followUpData = {
      patientId,
      authorId: 'vol_1',
      authorName: 'Marta Rodríguez',
      contactType,
      symptoms,
      distress,
      symptomObservations,
      socialRisk: { familySupport, environmentNotes },
      equipmentList,
      interventions,
      alertActivated
    };

    setTimeout(() => {
      try {
        dbService.saveFollowUp(followUpData);
        onSaveSuccess();
      } catch (err) {
        setErrorMsg('Error al guardar el reporte: ' + err.message);
        setIsSaving(false);
      }
    }, 1000);
  };

  const renderDropdown = (id, label, options, value, setter) => (
    <div className="form-group flex-1">
      <label className="text-label-md">{label}</label>
      <select className="w-full p-2 border border-outline-variant rounded-lg" value={value} onChange={(e) => setter(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-outline)', marginBottom: '8px' }}>
            <span style={{ cursor: 'pointer' }} onClick={onCancel}>Ficha del Paciente</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', margin: '0 4px' }}>chevron_right</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Nuevo Seguimiento</span>
          </nav>
          <h1 style={{ color: 'var(--color-on-background)' }}>Registro Clínico de Seguimiento</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bento-grid">
        <div style={{ gridColumn: 'span 8' }} className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Sintomatología</h2>
          <div className="grid grid-cols-2 gap-4">
            {renderDropdown('dolor', 'Dolor', ['Ausente', 'Leve', 'Moderado', 'Severo'], symptoms.dolor, (v) => setSymptoms({...symptoms, dolor: v}))}
            {renderDropdown('nauseas', 'Náuseas', ['Ausente', 'Leve', 'Moderado', 'Severo'], symptoms.nauseas, (v) => setSymptoms({...symptoms, nauseas: v}))}
            {renderDropdown('disnea', 'Disnea', ['Ausente', 'Leve', 'Moderado', 'Severo'], symptoms.disnea, (v) => setSymptoms({...symptoms, disnea: v}))}
            {renderDropdown('insomnio', 'Insomnio', ['Ausente', 'Presente'], symptoms.insomnio, (v) => setSymptoms({...symptoms, insomnio: v}))}
          </div>
          <textarea className="w-full mt-4 p-3 border rounded-lg" placeholder="Observaciones de síntomas..." value={symptomObservations} onChange={(e) => setSymptomObservations(e.target.value)} rows="3"></textarea>
        </div>

        <div style={{ gridColumn: 'span 4' }} className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Equipamiento</h2>
          <div className="grid grid-cols-1 gap-3">
            {renderDropdown('oxigeno', 'Oxígeno', ['No requiere', 'En uso', 'Solicitado'], equipmentList.oxigeno, (v) => setEquipmentList({...equipmentList, oxigeno: v}))}
            {renderDropdown('cama', 'Cama Clínica', ['No requiere', 'En uso', 'Solicitado'], equipmentList.cama, (v) => setEquipmentList({...equipmentList, cama: v}))}
            {renderDropdown('silla', 'Silla Ruedas', ['No requiere', 'En uso', 'Solicitado'], equipmentList.silla, (v) => setEquipmentList({...equipmentList, silla: v}))}
            {renderDropdown('aspirador', 'Aspirador', ['No requiere', 'En uso', 'Solicitado'], equipmentList.aspirador, (v) => setEquipmentList({...equipmentList, aspirador: v}))}
          </div>
        </div>

        <div style={{ gridColumn: 'span 12' }} className="card">
          <label>Intervenciones Realizadas *</label>
          <textarea className="w-full mt-2 p-3 border rounded-lg" value={interventions} onChange={(e) => setInterventions(e.target.value)} rows="4" required></textarea>
        </div>
        
        <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button type="button" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar Seguimiento</button>
        </div>
      </form>
    </div>
  );
}
