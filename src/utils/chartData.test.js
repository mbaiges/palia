import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthlyHoursChart,
  buildWeeklyVisitsChart,
  barFillMatchesValues,
  estimateFollowUpHours,
  filterFollowUpsByPeriod,
  sumFollowUpHours,
  toBarFillStyle,
} from './chartData.js';

const sampleFollowUps = [
  { id: 'a', date: '2026-06-30T10:00:00-03:00', contactType: 'Presencial' },
  { id: 'b', date: '2026-06-28T10:00:00-03:00', contactType: 'Remoto' },
  { id: 'c', date: '2026-05-15T10:00:00-03:00', contactType: 'Presencial', durationHours: 5 },
  { id: 'd', date: '2026-05-20T10:00:00-03:00', contactType: 'Presencial', durationHours: 2 },
  { id: 'e', date: '2023-10-12T16:45:00-03:00', contactType: 'Presencial' },
];

describe('chartData', () => {
  it('estimates follow-up hours from contact type and explicit duration', () => {
    assert.equal(estimateFollowUpHours({ contactType: 'Remoto' }), 1);
    assert.equal(estimateFollowUpHours({ contactType: 'Presencial' }), 2);
    assert.equal(estimateFollowUpHours({ durationHours: 4.5 }), 4.5);
  });

  it('builds monthly hours from follow-ups in the selected year', () => {
    const referenceDate = new Date('2026-07-01T12:00:00');
    const chart = buildMonthlyHoursChart(sampleFollowUps, referenceDate);
    const june = chart.find((bar) => bar.label === 'Jun');
    const may = chart.find((bar) => bar.label === 'May');

    assert.equal(june.value, 3);
    assert.equal(may.value, 7);
    assert.equal(barFillMatchesValues(chart), true);
    assert.ok(may.fillPercent > june.fillPercent);
  });

  it('keeps taller bars for higher monthly values', () => {
    const referenceDate = new Date('2026-07-01T12:00:00');
    const chart = buildMonthlyHoursChart(sampleFollowUps, referenceDate);
    const may = chart.find((bar) => bar.label === 'May');
    const jun = chart.find((bar) => bar.label === 'Jun');

    assert.ok(may.fillPercent > jun.fillPercent);
    assert.equal(toBarFillStyle(may.fillPercent), `${may.fillPercent}%`);
  });

  it('filters follow-ups by rolling period days', () => {
    const referenceDate = new Date('2026-07-01T12:00:00');
    const weekItems = filterFollowUpsByPeriod(sampleFollowUps, referenceDate, 7);
    assert.equal(weekItems.length, 2);
    assert.equal(weekItems[0].id, 'a');
  });

  it('builds weekly visit counts for the current week', () => {
    const referenceDate = new Date('2026-07-01T12:00:00');
    const chart = buildWeeklyVisitsChart(sampleFollowUps, referenceDate, 7);
    const total = chart.reduce((sum, bar) => sum + bar.value, 0);
    assert.equal(total, 2);
    assert.equal(barFillMatchesValues(chart), true);
  });

  it('sums yearly follow-up hours from db events', () => {
    const total2026 = sumFollowUpHours(sampleFollowUps, 2026);
    assert.equal(total2026, 10);
  });
});
