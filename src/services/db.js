// Database Service using localStorage (Modularized for future Firebase/Supabase connection)

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
const SEED_VERSION = 2;

// Seed Data
const DEFAULT_HOSPITALS = [
  { id: "hosp_1", name: "Hospital General Universitario", address: "C/ Salud Pública 45", zone: "Zona Norte" },
  { id: "hosp_2", name: "Clínica Santa María", address: "Av. Independencia 12", zone: "Zona Centro" },
  { id: "hosp_3", name: "Centro de Salud Local 4", address: "Paseo del Prado s/n", zone: "Zona Sur" },
  { id: "hosp_4", name: "Hospital Dr. Sótero del Río", address: "Av. Concha y Toro 3459", zone: "Zona Metropolitana" },
  { id: "hosp_5", name: "Hospital Virgen de las Nieves", address: "Av. de las Fuerzas Armadas s/n", zone: "Zona Norte" },
  { id: "hosp_6", name: "Centro de Salud San Antón", address: "Calle de la Alfalfa 8", zone: "Zona Este" }
];

const DEFAULT_VOLUNTEERS = [
  { id: "vol_1", name: "Marta Rodríguez", specialty: "Acompañamiento Domiciliario", tenure: "5+ años", activePatients: 3, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoMorZhuuIdD3D_yruSgiDIoiG5ijRwNzvfRmqf7Z7zHHe3K-Rq54oUHighN12KVXqDIqFvdlf3QJLpdtO0HWTzsH6ZSnloVMDUrqtTm-4iIziz_ewowaCxfDGcx06FMm_t-6JzdORdciGEBFUwy19VwgxNTzaI8w2gXYGh-lSWdBJZR_R4RTd9UPk_4ljoCPYE5Yg6WHF-2kZGN3hewbePdQfT2c4_sevaieK79Uuz3FMpm6u7EkNPrV4dTV6gSRY3GWg-jmecKI", status: "Activo" },
  { id: "vol_2", name: "Javier Méndez", specialty: "Apoyo Administrativo y Logística", tenure: "2 años", activePatients: 0, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDocLyIbvxKkPvwCTZ9b1HDrkjrfAOeTeApAe6DjmkIQUg63Oq701isD7KV1qXs-YMZmWzEE195fBjFPRw2jVECLKnpaFb87HxiapaNFeTESm-4rXBFgphIai8JHPVDpH-4U-bbQD-fx6jz8Dzxum6yXZH_XdrD9gtnc6r_aBfCw2ySpq_JuWbNY9K2kdE24kW7ctkrH0CrugJovWEdnGVLCGW-XuQShu1sycB405ga4-fMCNSFJTFj20hf5J1cLoNWqc7LziImVl0", status: "Activo" },
  { id: "vol_3", name: "Elena Costa", specialty: "Coordinadora de Duelo", tenure: "8+ años", activePatients: 5, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTirtjtvISR1Tr0BTyW_ezVf2SE8FpqhijglYiNVp9eCuGsJG5djDA4hFPsL-HMFIhLi2Bqr1m9lIA5ofpIXmLES5CBbIGJrK4hgFy5rJN1AqA5PHUT6eKvXbVtf_4EnyeqYg-KnAyCLPGRsFCgMQvB2k200sNTAlvHOK8zIb3xAZfsm2RMnTSYvj6RJiX8X4WiGDug18KJe17gkhgWqyKrrrYlxaVN8p4PnOn6esjvgRglQQvN_3D_abBoHM5uwV9B2fsvTSMJQc", status: "Activo" },
  { id: "vol_4", name: "Ricardo Salinas", specialty: "Asistencia Espiritual", tenure: "Nuevo", activePatients: 1, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlvGLUwD39xC-qOQFA1CJnWqO4T-UI60_bM42occbS3rwGxweMBY9JoJGDhdRNPkHQx1dKy1OLoN36I9LB0qIQbcDzxKUS9eNgMpF-2htsyBtVXA1bt1TmzuHA0ziG9HVnAqxgT89lr7e8kM10U-uOSnHWeq65eTWWFUz6N8Gcl8ptl9Cz9irVJ2u6zlOR_iB6EKb_4fQqHL-cnqHtnh-zmFqYzYmHcPHRztMVdP9SIZCRVxvmCM2S43aiKyICLCLx0do9i1CI6g4", status: "Activo" },
  { id: "vol_5", name: "Javier Soler", specialty: "Tardes (M-J)", tenure: "1 año", activePatients: 1, avatar: "", status: "Activo" },
  { id: "vol_6", name: "Elena Martínez", specialty: "Disponibilidad Completa", tenure: "3 años", activePatients: 2, avatar: "", status: "Activo" }
];

const DEFAULT_PATIENTS = [
  {
    id: "pat_1",
    name: "Ricardo Mendoza S.",
    dni: "45.281.902-K",
    dob: "1952-04-14",
    address: "Calle Falsa 123, Bernal Oeste, Quilmes, GBA",
    diagnosis: "Carcinoma bronquial avanzado con metástasis óseas. Manejo paliativo de dolor y soporte emocional familiar.",
    hospitalId: "hosp_4",
    currentStatus: "Alerta", // "Estable" | "En Observación" | "Alerta"
    assignedVolunteers: ["vol_1", "vol_4"],
    createdAt: "2023-09-01T10:00:00Z"
  },
  {
    id: "pat_2",
    name: "Manuel Segovia",
    dni: "08.821.544-F",
    dob: "1948-11-23",
    address: "Av. Mitre 4550, Avellaneda, GBA",
    diagnosis: "Insuficiencia cardíaca congestiva terminal. Soporte domiciliario.",
    hospitalId: "hosp_1",
    currentStatus: "Estable",
    assignedVolunteers: ["vol_6"],
    createdAt: "2023-12-10T11:30:00Z"
  },
  {
    id: "pat_3",
    name: "Elena Gutiérrez",
    dni: "14.773.299-X",
    dob: "1945-08-30",
    address: "Pio IX 820, Bernal Oeste, Quilmes, GBA",
    diagnosis: "Esclerosis Lateral Amiotrófica (ELA). Soporte respiratorio no invasivo y control de disnea.",
    hospitalId: "hosp_2",
    currentStatus: "Alerta",
    assignedVolunteers: ["vol_1", "vol_5"],
    createdAt: "2024-01-15T09:00:00Z"
  },
  {
    id: "pat_4",
    name: "Fernando Rivas",
    dni: "22.441.288-M",
    dob: "1960-03-05",
    address: "Humberto Primo 1220, CABA",
    diagnosis: "Glioblastoma multiforme. Cuidado post-radioterapia, contención familiar y relevo del cuidador.",
    hospitalId: "hosp_3",
    currentStatus: "En Observación",
    assignedVolunteers: ["vol_6"],
    createdAt: "2024-02-20T14:00:00Z"
  }
];

const DEFAULT_CAREGIVERS = {
  "pat_1": {
    patientId: "pat_1",
    name: "Elena Mendoza R.",
    relation: "Hija",
    phone: "+56 9 8234 1109",
    livesWithPatient: true,
    burdenLevel: "Bajo"
  },
  "pat_2": {
    patientId: "pat_2",
    name: "Sofía Segovia",
    relation: "Esposa",
    phone: "+54 9 11 9999 8888",
    livesWithPatient: true,
    burdenLevel: "Moderado"
  },
  "pat_3": {
    patientId: "pat_3",
    name: "Juan Gutiérrez",
    relation: "Hijo",
    phone: "+54 9 11 5555 4321",
    livesWithPatient: false,
    burdenLevel: "Alto"
  },
  "pat_4": {
    patientId: "pat_4",
    name: "Amelia Rivas",
    relation: "Hermana",
    phone: "+54 9 11 7777 6666",
    livesWithPatient: true,
    burdenLevel: "Bajo"
  }
};

const DEFAULT_EVENTS = [
  {
    id: "ev_1",
    patientId: "pat_1",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2023-10-12T16:45:00-03:00",
    contactType: "Presencial",
    symptoms: {
      pain: "1-3 - Leve",
      nausea: "Ninguno",
      dyspnea: "Grado 0 - Normal"
    },
    symptomObservations: "Se observa al paciente tranquilo. Control de dolor efectivo con medicación actual. Elena comenta que ha podido descansar mejor estas últimas noches. Se refuerzan ejercicios de movilidad suave.",
    socialRisk: {
      familySupport: "Sólido y constante",
      environmentNotes: "Hogar limpio, ventilado y con buena higiene."
    },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Ejercicios de movilidad suave y contención activa.",
    alertActivated: false
  },
  {
    id: "ev_2",
    patientId: "pat_1",
    authorId: "vol_4",
    authorName: "Ricardo Salinas",
    date: "2023-10-05T11:20:00-03:00",
    contactType: "Remoto",
    symptoms: {
      pain: "4-6 - Moderado",
      nausea: "Ninguno",
      dyspnea: "Grado 1 - Leve"
    },
    symptomObservations: "Seguimiento de rutina. El paciente presenta leve agitación por la mañana. Se sugiere ventilación de habitación y música ambiental. Elena refiere agotamiento.",
    socialRisk: {
      familySupport: "Intermitente / Fragilidad",
      environmentNotes: "Se coordina visita de relevo de voluntario para el fin de semana para aliviar al cuidador."
    },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Llamado de apoyo emocional, contención espiritual.",
    alertActivated: false
  },
  {
    id: "ev_3",
    patientId: "pat_1",
    authorId: "admin",
    authorName: "Admin Central",
    date: "2023-09-28T22:15:00-03:00",
    contactType: "Presencial",
    symptoms: {
      pain: "10 - Insoportable",
      nausea: "Persistente",
      dyspnea: "Grado 3 - Severa"
    },
    symptomObservations: "Reporte de crisis de dolor irruptivo. Se contacta a equipo médico de turno. Se administran dosis de rescate según protocolo. Paciente logra estabilizarse tras 40 minutos.",
    socialRisk: {
      familySupport: "Sólido y constante",
      environmentNotes: "Elena asustada por el cuadro de dolor agudo, pero sigue indicaciones del protocolo médico al pie de la letra."
    },
    equipmentNeeds: ["Concentrador Oxígeno"],
    equipmentOther: "",
    interventions: "Coordinación médica de urgencia. Soporte y acompañamiento durante crisis de dolor irruptivo.",
    alertActivated: true
  },
  {
    id: "ev_4",
    patientId: "pat_3",
    authorId: "admin",
    authorName: "Admin Central",
    date: "2026-06-30T10:00:00-03:00",
    contactType: "Presencial",
    symptoms: {
      pain: "7-9 - Severo",
      nausea: "Ocasional",
      dyspnea: "Grado 2 - Moderada"
    },
    symptomObservations: "Alerta de crisis respiratoria. Elena Gutiérrez presenta disnea moderada e incremento del dolor. Requiere intervención y ajuste médico.",
    socialRisk: {
      familySupport: "Ausente / Riesgo Crítico",
      environmentNotes: "El cuidador principal (Juan) ausente por trabajo, paciente se encontraba sola."
    },
    equipmentNeeds: ["Concentrador Oxígeno", "Aspirador Secreciones"],
    equipmentOther: "",
    interventions: "Activación de red de apoyo. Reubicación temporal de familiar para cuidados continuos.",
    alertActivated: true
  },
  {
    id: "ev_5",
    patientId: "pat_2",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-25T11:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "1-3 - Leve", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Visita domiciliaria de control. Manuel mantiene estabilidad clínica y buen cumplimiento terapéutico.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Esposa presente y colaborativa." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Revisión de signos vitales, acompañamiento y refuerzo de pautas de cuidado.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_6",
    patientId: "pat_4",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-26T16:30:00-03:00",
    contactType: "Remoto",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ocasional", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Seguimiento telefónico tras sesión de radioterapia. Fernando refiere fatiga vespertina.",
    socialRisk: { familySupport: "Intermitente / Fragilidad", environmentNotes: "Hermana solicita relevo los fines de semana." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Coordinación de visita presencial y ajuste de plan de descanso.",
    alertActivated: false,
    durationHours: 1
  },
  {
    id: "ev_7",
    patientId: "pat_1",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-27T10:15:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "7-9 - Severo", nausea: "Persistente", dyspnea: "Grado 2 - Moderada" },
    symptomObservations: "Incremento del dolor y disnea. Se activa protocolo de alerta y se contacta al equipo médico.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Cuidadora principal presente durante la visita." },
    equipmentNeeds: ["Concentrador Oxígeno"],
    equipmentOther: "",
    interventions: "Administración de medicación de rescate y monitoreo continuo.",
    alertActivated: true,
    durationHours: 2.5
  },
  {
    id: "ev_8",
    patientId: "pat_3",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-28T09:40:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "7-9 - Severo", nausea: "Ocasional", dyspnea: "Grado 2 - Moderada" },
    symptomObservations: "Control post-crisis. Disnea en mejoría con oxigenoterapia. Se refuerza plan de cuidados nocturnos.",
    socialRisk: { familySupport: "Intermitente / Fragilidad", environmentNotes: "Se acuerda presencia de familiar de relevo." },
    equipmentNeeds: ["Concentrador Oxígeno"],
    equipmentOther: "",
    interventions: "Educación al cuidador y verificación de equipamiento domiciliario.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_9",
    patientId: "pat_2",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-30T15:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "1-3 - Leve", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Visita semanal de acompañamiento. Buen estado general y adherencia al tratamiento.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Ambiente domiciliario ordenado." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Contención emocional y revisión de medicación.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_10",
    patientId: "pat_4",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-07-01T08:30:00-03:00",
    contactType: "Remoto",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ninguno", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Check-in matutino de la coordinadora. Paciente estable, sin signos de alarma.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Próxima visita presencial programada." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Seguimiento telefónico y actualización del plan semanal.",
    alertActivated: false,
    durationHours: 1
  },
  {
    id: "ev_11",
    patientId: "pat_1",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-01-14T11:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Inicio de seguimiento intensivo del trimestre. Se documenta plan conjunto con la familia.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Buen soporte domiciliario." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Evaluación integral y definición de objetivos de cuidado.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_12",
    patientId: "pat_2",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-01-22T10:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "1-3 - Leve", nausea: "Ninguno", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Control mensual. Paciente estable y colaborador.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Sin cambios en el entorno." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Acompañamiento y revisión de síntomas.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_13",
    patientId: "pat_3",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-02-08T14:30:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ocasional", dyspnea: "Grado 2 - Moderada" },
    symptomObservations: "Seguimiento respiratorio. Se refuerza uso de dispositivos y posición semi-Fowler.",
    socialRisk: { familySupport: "Intermitente / Fragilidad", environmentNotes: "Se coordina apoyo adicional." },
    equipmentNeeds: ["Concentrador Oxígeno"],
    equipmentOther: "",
    interventions: "Capacitación al cuidador y verificación de oxígeno.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_14",
    patientId: "pat_4",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-02-19T09:15:00-03:00",
    contactType: "Remoto",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ocasional", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Llamada de seguimiento post-consulta oncológica.",
    socialRisk: { familySupport: "Intermitente / Fragilidad", environmentNotes: "Se programan visitas de relevo." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Contención telefónica y coordinación logística.",
    alertActivated: false,
    durationHours: 1
  },
  {
    id: "ev_15",
    patientId: "pat_1",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-03-05T16:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "7-9 - Severo", nausea: "Persistente", dyspnea: "Grado 2 - Moderada" },
    symptomObservations: "Episodio de dolor irruptivo controlado en domicilio con medicación de rescate.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Familia siguió protocolo correctamente." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Soporte durante crisis y registro para equipo médico.",
    alertActivated: true,
    durationHours: 3
  },
  {
    id: "ev_16",
    patientId: "pat_2",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-03-18T11:30:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "1-3 - Leve", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Visita de rutina con buena evolución clínica.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Sin novedades ambientales." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Revisión de medicación y escucha activa.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_17",
    patientId: "pat_3",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-04-02T10:45:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ocasional", dyspnea: "Grado 2 - Moderada" },
    symptomObservations: "Control de disnea y ajuste de rutinas de movilización asistida.",
    socialRisk: { familySupport: "Intermitente / Fragilidad", environmentNotes: "Cuidador principal con sobrecarga moderada." },
    equipmentNeeds: ["Concentrador Oxígeno"],
    equipmentOther: "",
    interventions: "Técnicas de posicionamiento y apoyo emocional.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_18",
    patientId: "pat_4",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-04-16T13:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ninguno", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Visita presencial con evaluación de fatiga y estado anímico.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Red familiar activa." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Contención y planificación de actividades adaptadas.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_19",
    patientId: "pat_1",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-05-07T09:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Seguimiento mensual con mejoría parcial del dolor basal.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Buen clima familiar." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Revisión de pauta analgésica y movilización suave.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_20",
    patientId: "pat_2",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-05-21T15:30:00-03:00",
    contactType: "Remoto",
    symptoms: { pain: "1-3 - Leve", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Control telefónico quincenal sin eventos adversos.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Sin cambios." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Seguimiento de rutina y actualización de agenda.",
    alertActivated: false,
    durationHours: 1
  },
  {
    id: "ev_21",
    patientId: "pat_3",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-04T11:20:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "7-9 - Severo", nausea: "Ocasional", dyspnea: "Grado 2 - Moderada" },
    symptomObservations: "Evaluación previa a alerta activa. Se refuerza red de apoyo domiciliario.",
    socialRisk: { familySupport: "Ausente / Riesgo Crítico", environmentNotes: "Se gestiona relevo familiar." },
    equipmentNeeds: ["Concentrador Oxígeno", "Aspirador Secreciones"],
    equipmentOther: "",
    interventions: "Coordinación con equipo y activación de medidas preventivas.",
    alertActivated: false,
    durationHours: 2.5
  },
  {
    id: "ev_22",
    patientId: "pat_4",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2026-06-12T10:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ocasional", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Visita de mitad de mes con foco en calidad de vida y descanso.",
    socialRisk: { familySupport: "Intermitente / Fragilidad", environmentNotes: "Se acuerdan horarios de relevo." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Acompañamiento y ajuste de plan de visitas.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_23",
    patientId: "pat_1",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2025-11-10T10:30:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "4-6 - Moderado", nausea: "Ninguno", dyspnea: "Grado 1 - Leve" },
    symptomObservations: "Histórico de seguimiento del año anterior para continuidad asistencial.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Continuidad de cuidados en domicilio." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Evaluación trimestral y actualización de objetivos.",
    alertActivated: false,
    durationHours: 2
  },
  {
    id: "ev_24",
    patientId: "pat_2",
    authorId: "vol_1",
    authorName: "Marta Rodríguez",
    date: "2025-12-05T14:00:00-03:00",
    contactType: "Presencial",
    symptoms: { pain: "1-3 - Leve", nausea: "Ninguno", dyspnea: "Grado 0 - Normal" },
    symptomObservations: "Cierre de año con paciente estable y plan de vacaciones de cuidador acordado.",
    socialRisk: { familySupport: "Sólido y constante", environmentNotes: "Red de apoyo disponible en fiestas." },
    equipmentNeeds: [],
    equipmentOther: "",
    interventions: "Planificación de cobertura y contención emocional.",
    alertActivated: false,
    durationHours: 2
  }
];

const DEFAULT_INVITATIONS = [
  { id: "inv_1", name: "Roberto Martínez", email: "r.martinez@health.org", date: "12 Oct, 2023", status: "Pendiente", role: "Voluntario" },
  { id: "inv_2", name: "Lucía Castro", email: "l.castro@voluntarios.es", date: "10 Oct, 2023", status: "Registrado", role: "Coordinador" },
  { id: "inv_3", name: "Jorge Sánchez", email: "jorge.s@provider.com", date: "01 Oct, 2023", status: "Expirado", role: "Voluntario" },
  { id: "inv_4", name: "Elena Pascual", email: "epascual@care.org", date: "13 Oct, 2023", status: "Pendiente", role: "Voluntario" }
];

// DB Helper Logic
function getStorage(key, defaultValue) {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
}

function setStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function mergeSeedRecords(key, defaults) {
  const existing = getStorage(key, defaults);
  const ids = new Set(existing.map((item) => item.id));
  let changed = false;

  defaults.forEach((item) => {
    if (!ids.has(item.id)) {
      existing.push(item);
      changed = true;
    }
  });

  if (changed) {
    setStorage(key, existing);
  }

  return existing;
}

function applySeedUpgrades() {
  const currentVersion = parseInt(localStorage.getItem('medice_seed_version') || '0', 10);
  if (currentVersion >= SEED_VERSION) return;

  mergeSeedRecords('medice_events', DEFAULT_EVENTS);
  localStorage.setItem('medice_seed_version', String(SEED_VERSION));
  console.log(`Medice seed upgraded to v${SEED_VERSION}.`);
}

// Public API
export const dbService = {
  initialize() {
    getStorage("medice_hospitals", DEFAULT_HOSPITALS);
    getStorage("medice_volunteers", DEFAULT_VOLUNTEERS);
    getStorage("medice_patients", DEFAULT_PATIENTS);
    getStorage("medice_caregivers", DEFAULT_CAREGIVERS);
    getStorage("medice_events", DEFAULT_EVENTS);
    getStorage("medice_invitations", DEFAULT_INVITATIONS);
    applySeedUpgrades();
    console.log("Medice local storage database initialized.");
  },

  // Patients
  getPatients() {
    return getStorage("medice_patients", DEFAULT_PATIENTS);
  },

  getPatient(id) {
    const patients = this.getPatients();
    return patients.find(p => p.id === id) || null;
  },

  savePatient(patientData, caregiverData) {
    const patients = this.getPatients();
    let isNew = false;
    
    if (!patientData.id) {
      patientData.id = "pat_" + Date.now();
      patientData.createdAt = new Date().toISOString();
      isNew = true;
    }

    if (isNew) {
      patients.push(patientData);
    } else {
      const idx = patients.findIndex(p => p.id === patientData.id);
      if (idx !== -1) patients[idx] = patientData;
    }
    setStorage("medice_patients", patients);

    // Save Caregiver
    const caregivers = getStorage("medice_caregivers", DEFAULT_CAREGIVERS);
    caregiverData.patientId = patientData.id;
    caregivers[patientData.id] = caregiverData;
    setStorage("medice_caregivers", caregivers);

    return patientData.id;
  },

  updatePatientStatus(patientId, status) {
    const patients = this.getPatients();
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx !== -1) {
      patients[idx].currentStatus = status;
      setStorage("medice_patients", patients);
    }
  },

  // Caregivers
  getCaregiverForPatient(patientId) {
    const caregivers = getStorage("medice_caregivers", DEFAULT_CAREGIVERS);
    return caregivers[patientId] || null;
  },

  // Follow-ups (Events)
  getFollowUpsForPatient(patientId) {
    const events = getStorage("medice_events", DEFAULT_EVENTS);
    return events.filter(e => e.patientId === patientId).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  saveFollowUp(eventData) {
    const events = getStorage("medice_events", DEFAULT_EVENTS);
    eventData.id = "ev_" + Date.now();
    eventData.date = new Date().toISOString();
    
    events.push(eventData);
    setStorage("medice_events", events);

    // Update patient alert status dynamically if checked
    if (eventData.alertActivated) {
      this.updatePatientStatus(eventData.patientId, "Alerta");
    } else {
      // Re-evaluate if there's any active alert left, otherwise set observer or stable
      this.updatePatientStatus(eventData.patientId, "Estable");
    }

    return eventData;
  },

  // Volunteers
  getVolunteers() {
    return getStorage("medice_volunteers", DEFAULT_VOLUNTEERS);
  },

  saveVolunteer(volunteer) {
    const volunteers = this.getVolunteers();
    if (!volunteer.id) {
      volunteer.id = "vol_" + Date.now();
      volunteers.push(volunteer);
    } else {
      const idx = volunteers.findIndex(v => v.id === volunteer.id);
      if (idx !== -1) volunteers[idx] = volunteer;
    }
    setStorage("medice_volunteers", volunteers);
    return volunteer;
  },

  // Assign Volunteers to Patients
  assignVolunteersToPatient(patientId, volunteerIds) {
    const patients = this.getPatients();
    const patientIdx = patients.findIndex(p => p.id === patientId);
    
    if (patientIdx !== -1) {
      // Remove patient from previous volunteers active list
      const oldVolunteers = patients[patientIdx].assignedVolunteers || [];
      const volunteers = this.getVolunteers();
      
      volunteers.forEach(v => {
        if (oldVolunteers.includes(v.id) && !volunteerIds.includes(v.id)) {
          v.activePatients = Math.max(0, (v.activePatients || 1) - 1);
        } else if (!oldVolunteers.includes(v.id) && volunteerIds.includes(v.id)) {
          v.activePatients = (v.activePatients || 0) + 1;
        }
      });
      setStorage("medice_volunteers", volunteers);

      patients[patientIdx].assignedVolunteers = volunteerIds;
      setStorage("medice_patients", patients);
    }
  },

  // Hospitals CRUD
  getHospitals() {
    return getStorage("medice_hospitals", DEFAULT_HOSPITALS);
  },

  saveHospital(hospital) {
    const hospitals = this.getHospitals();
    if (!hospital.id) {
      hospital.id = "hosp_" + Date.now();
      hospitals.push(hospital);
    } else {
      const idx = hospitals.findIndex(h => h.id === hospital.id);
      if (idx !== -1) hospitals[idx] = hospital;
    }
    setStorage("medice_hospitals", hospitals);
    return hospital;
  },

  deleteHospital(id) {
    const hospitals = this.getHospitals();
    const filtered = hospitals.filter(h => h.id !== id);
    setStorage("medice_hospitals", filtered);
  },

  getAllFollowUps() {
    return getStorage("medice_events", DEFAULT_EVENTS);
  },

  assignVolunteerToPatient(patientId, volunteerId) {
    const patients = this.getPatients();
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx !== -1) {
      const assigned = patients[idx].assignedVolunteers || [];
      if (!assigned.includes(volunteerId)) {
        const updated = [...assigned, volunteerId];
        this.assignVolunteersToPatient(patientId, updated);
      }
    }
  },

  isCloudBackend() {
    return USE_FIREBASE;
  },

  // Onboarding Invitations
  getInvitations() {
    return getStorage("medice_invitations", DEFAULT_INVITATIONS);
  },

  saveInvitation(invite) {
    const invites = this.getInvitations();
    invite.id = "inv_" + Date.now();
    // Format: "12 Oct, 2023"
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    invite.date = `${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    invites.push(invite);
    setStorage("medice_invitations", invites);
    return invite;
  },

  revokeInvitation(id) {
    const invites = this.getInvitations();
    const idx = invites.findIndex(inv => inv.id === id);
    if (idx !== -1) {
      invites[idx].status = "Expirado";
      setStorage("medice_invitations", invites);
    }
  },

  deleteInvitation(id) {
    const invites = this.getInvitations();
    const filtered = invites.filter(inv => inv.id !== id);
    setStorage("medice_invitations", filtered);
  }
};
