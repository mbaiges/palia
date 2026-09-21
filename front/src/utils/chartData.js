const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const ACHIEVEMENT_DEFINITIONS = [
  { id: "first-step", label: "Primer Paso" },
  { id: "faithful-companion", label: "Compañero Fiel" },
  { id: "specialist", label: "Especialista" },
  { id: "senior-guide", label: "Guía Senior" },
];

export function parseFollowUpDate(followUp) {
  if (!followUp?.date && !followUp?.createdAt) return null;
  const parsed = new Date(followUp.date || followUp.createdAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function estimateFollowUpHours(followUp) {
  if (
    typeof followUp?.durationHours === "number" &&
    followUp.durationHours >= 0
  ) {
    return followUp.durationHours;
  }
  if (followUp?.contactType === "Remoto") return 1;
  return 2;
}

export function filterFollowUpsByPeriod(
  followUps,
  referenceDate = new Date(),
  periodDays = 7,
) {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (periodDays - 1));

  return followUps.filter((followUp) => {
    const date = parseFollowUpDate(followUp);
    return date && date >= start && date <= end;
  });
}

export function buildWeeklyVisitsChart(
  followUps,
  referenceDate = new Date(),
  periodDays = 7,
) {
  const dayCounts = Array(7).fill(0);
  const periodItems = filterFollowUpsByPeriod(
    followUps,
    referenceDate,
    periodDays,
  );

  periodItems.forEach((followUp) => {
    const date = parseFollowUpDate(followUp);
    if (!date) return;
    const jsDay = date.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    dayCounts[idx] += 1;
  });

  const maxCount = Math.max(...dayCounts, 1);
  const todayDay = referenceDate.getDay();
  const todayIdx = todayDay === 0 ? 6 : todayDay - 1;

  return DAY_LABELS.map((label, index) => ({
    label,
    value: dayCounts[index],
    fillPercent:
      dayCounts[index] === 0
        ? 4
        : Math.max(8, Math.round((dayCounts[index] / maxCount) * 100)),
    active: index === todayIdx,
  }));
}

export function buildMonthlyHoursChart(followUps, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const hoursByMonth = Array(12).fill(0);

  followUps.forEach((followUp) => {
    const date = parseFollowUpDate(followUp);
    if (!date || date.getFullYear() !== year) return;
    hoursByMonth[date.getMonth()] += estimateFollowUpHours(followUp);
  });

  const maxHours = Math.max(...hoursByMonth, 1);
  const currentMonth = referenceDate.getMonth();

  return MONTH_LABELS.map((label, index) => ({
    label,
    value: hoursByMonth[index],
    fillPercent:
      hoursByMonth[index] === 0
        ? 4
        : Math.max(8, Math.round((hoursByMonth[index] / maxHours) * 100)),
    active: index === currentMonth,
  }));
}

export function sumFollowUpHours(followUps, year = new Date().getFullYear()) {
  return followUps.reduce((total, followUp) => {
    const date = parseFollowUpDate(followUp);
    if (!date || date.getFullYear() !== year) return total;
    return total + estimateFollowUpHours(followUp);
  }, 0);
}

export function buildVolunteerAchievements(followUps) {
  const ordered = followUps
    .map((followUp) => ({ followUp, date: parseFollowUpDate(followUp) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date);
  const achievedAt = new Map();
  let minutes = 0;
  const patients = new Set();

  for (let index = 0; index < ordered.length; index += 1) {
    const { followUp, date } = ordered[index];
    minutes += estimateFollowUpHours(followUp) * 60;
    patients.add(followUp.patientId);
    if (!achievedAt.has("first-step") && minutes >= 300)
      achievedAt.set("first-step", date);
    if (!achievedAt.has("faithful-companion") && patients.size >= 2)
      achievedAt.set("faithful-companion", date);
    if (
      !achievedAt.has("specialist") &&
      (followUp.alertActivated || followUp.alert)
    )
      achievedAt.set("specialist", date);
    if (index >= 5 && !achievedAt.has("senior-guide"))
      achievedAt.set("senior-guide", date);
  }

  return ACHIEVEMENT_DEFINITIONS.filter((achievement) =>
    achievedAt.has(achievement.id),
  ).map((achievement) => ({
    ...achievement,
    achievedAt: achievedAt.get(achievement.id).toISOString(),
  }));
}

export function barFillMatchesValues(chartBars) {
  const nonZero = chartBars.filter((bar) => bar.value > 0);
  for (let i = 0; i < nonZero.length; i += 1) {
    for (let j = i + 1; j < nonZero.length; j += 1) {
      const a = nonZero[i];
      const b = nonZero[j];
      if (a.value > b.value && a.fillPercent < b.fillPercent) return false;
      if (b.value > a.value && b.fillPercent < a.fillPercent) return false;
    }
  }
  return true;
}

export function toBarFillStyle(fillPercent) {
  return `${fillPercent}%`;
}
