const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function parseFollowUpDate(followUp) {
  if (!followUp?.date && !followUp?.createdAt) return null;
  const parsed = new Date(followUp.date || followUp.createdAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function estimateFollowUpHours(followUp) {
  if (typeof followUp?.durationHours === 'number' && followUp.durationHours >= 0) {
    return followUp.durationHours;
  }
  if (followUp?.contactType === 'Remoto') return 1;
  return 2;
}

export function filterFollowUpsByPeriod(followUps, referenceDate = new Date(), periodDays = 7) {
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

export function buildWeeklyVisitsChart(followUps, referenceDate = new Date(), periodDays = 7) {
  const dayCounts = Array(7).fill(0);
  const periodItems = filterFollowUpsByPeriod(followUps, referenceDate, periodDays);

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
    fillPercent: dayCounts[index] === 0 ? 4 : Math.max(8, Math.round((dayCounts[index] / maxCount) * 100)),
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
    fillPercent: hoursByMonth[index] === 0 ? 4 : Math.max(8, Math.round((hoursByMonth[index] / maxHours) * 100)),
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
