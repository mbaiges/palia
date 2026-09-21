import React, { useState } from "react";
import { dbService } from "../services/db";
import {
  buildMonthlyHoursChart,
  buildWeeklyVisitsChart,
  buildVolunteerAchievements,
  sumFollowUpHours,
  toBarFillStyle,
} from "../utils/chartData";

export default function Stats() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [weeklyPeriod, setWeeklyPeriod] = useState(7);
  const role = dbService.getRole() ?? "volunteer";
  const isGlobal = role === "admin" || role === "coordinator";
  const userId = dbService.getCurrentUserId?.();
  const allFollowUps = dbService.getAllFollowUps();
  const followUps = isGlobal
    ? allFollowUps
    : allFollowUps.filter((item) => item.authorId === userId);
  const patients = dbService.getPatients();
  const stats = dbService.getStats()?.[isGlobal ? "global" : "personal"] ?? {};
  const now = new Date();
  const monthlyData = buildMonthlyHoursChart(
    followUps,
    new Date(selectedYear, now.getMonth(), now.getDate()),
  );
  const weeklyData = buildWeeklyVisitsChart(followUps, now, weeklyPeriod);
  const totalHours = sumFollowUpHours(followUps, selectedYear);
  const achievements = isGlobal ? [] : buildVolunteerAchievements(followUps);
  const patientsAttended = isGlobal
    ? new Set(followUps.map((item) => item.patientId)).size
    : Number(
        stats.patientsAttended ??
          new Set(followUps.map((item) => item.patientId)).size,
      );
  const metrics = isGlobal
    ? [
        {
          label: `Horas de acompañamiento (${selectedYear})`,
          value: `${Number(totalHours).toFixed(1)} h`,
        },
        {
          label: "Seguimientos registrados",
          value: Number(stats.visits ?? followUps.length),
        },
        {
          label: "Pacientes activos",
          value: Number(stats.activePatients ?? patients.length),
        },
        { label: "Alertas activas", value: Number(stats.activeAlerts ?? 0) },
        {
          label: "Voluntarios activos",
          value: Number(
            stats.activeVolunteers ?? dbService.getVolunteers().length,
          ),
        },
      ]
    : [
        {
          label: `Horas de acompañamiento (${selectedYear})`,
          value: `${totalHours} h`,
        },
        { label: "Seguimientos registrados", value: followUps.length },
        { label: "Pacientes atendidos", value: patientsAttended },
      ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-stack-lg)",
      }}
    >
      <header>
        <h1 style={{ color: "var(--color-on-background)" }}>
          Estadísticas e impacto
        </h1>
        <p style={{ color: "var(--color-on-surface-variant)", marginTop: 4 }}>
          {isGlobal
            ? "Resumen global calculado a partir de los datos registrados."
            : "Tu actividad calculada a partir de los seguimientos que registraste."}
        </p>
      </header>
      <section className="bento-grid" aria-label="Indicadores">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="card"
            style={{ gridColumn: "span 4" }}
          >
            <p style={{ color: "var(--color-on-surface-variant)", margin: 0 }}>
              {metric.label}
            </p>
            <strong style={{ display: "block", fontSize: 30, marginTop: 8 }}>
              {metric.value}
            </strong>
          </article>
        ))}
      </section>
      <section
        id="monthly-activity-chart"
        className="card"
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div className="weekly-summary__header">
          <div>
            <h2 style={{ fontSize: 18, margin: 0 }}>Actividad mensual</h2>
            <p
              style={{
                color: "var(--color-on-surface-variant)",
                margin: "4px 0 0",
              }}
            >
              Horas según la fecha local del dispositivo.
            </p>
          </div>
          <label>
            {" "}
            Año{" "}
            <select
              aria-label="Año de actividad"
              className="weekly-summary__filter"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {Array.from(
                { length: 6 },
                (_, index) => now.getFullYear() - index,
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="bar-chart bar-chart--monthly">
          {monthlyData.map((bar) => (
            <div key={bar.label} className="bar-chart__column">
              <span className="bar-chart__value">{bar.value} h</span>
              <div className="bar-chart__track">
                <div
                  className="bar-chart__bar"
                  data-hours={bar.value}
                  style={{
                    "--bar-fill": toBarFillStyle(bar.fillPercent),
                    backgroundColor: bar.active
                      ? "var(--color-primary)"
                      : "rgba(0, 90, 113, 0.15)",
                  }}
                />
              </div>
              <span className="bar-chart__label">{bar.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="weekly-summary__header">
          <div>
            <h2 style={{ fontSize: 18, margin: 0 }}>Actividad semanal</h2>
            <p style={{ color: "var(--color-on-surface-variant)" }}>
              Seguimientos confirmados por día de la semana.
            </p>
          </div>
          <label>
            Período{" "}
            <select
              aria-label="Período semanal"
              className="weekly-summary__filter"
              value={weeklyPeriod}
              onChange={(event) => setWeeklyPeriod(Number(event.target.value))}
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
            </select>
          </label>
        </div>
        <div className="bar-chart bar-chart--weekly">
          {weeklyData.map((bar) => (
            <div key={bar.label} className="bar-chart__column">
              <span className="bar-chart__value">{bar.value}</span>
              <div className="bar-chart__track">
                <div
                  className="bar-chart__bar"
                  title={`${bar.label}: ${bar.value} seguimientos`}
                  style={{
                    "--bar-fill": toBarFillStyle(bar.fillPercent),
                    backgroundColor: bar.active
                      ? "var(--color-primary)"
                      : "rgba(0, 90, 113, 0.15)",
                  }}
                />
              </div>
              <span className="bar-chart__label">{bar.label}</span>
            </div>
          ))}
        </div>
      </section>
      {!isGlobal && (
        <section className="card">
          <h2 style={{ fontSize: 18 }}>Reconocimientos</h2>
          {achievements.length === 0 ? (
            <p style={{ color: "var(--color-on-surface-variant)" }}>
              Los reconocimientos aparecen cuando alcanzás los objetivos con
              seguimientos confirmados.
            </p>
          ) : (
            <ul>
              {achievements.map((achievement) => (
                <li key={achievement.id}>
                  <strong>{achievement.label}</strong> ·{" "}
                  {new Date(achievement.achievedAt).toLocaleDateString("es-AR")}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <section className="card">
        <h2 style={{ fontSize: 18 }}>Seguimientos recientes</h2>
        {followUps.length === 0 ? (
          <p style={{ color: "var(--color-on-surface-variant)" }}>
            No hay seguimientos para mostrar.
          </p>
        ) : (
          <div className="table-scroll">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: 600,
              }}
            >
              <thead>
                <tr>
                  {["Fecha", "Paciente", "Voluntario", "Tipo", "Duración"].map(
                    (label) => (
                      <th key={label} style={{ padding: 12 }}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {followUps.slice(0, 20).map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: 12 }}>
                      {new Date(item.occurredAt || item.date).toLocaleString(
                        "es-AR",
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {patients.find((patient) => patient.id === item.patientId)
                        ?.name || "Paciente archivado"}
                    </td>
                    <td style={{ padding: 12 }}>
                      {item.authorName || "Voluntario"}
                    </td>
                    <td style={{ padding: 12 }}>{item.contactType}</td>
                    <td style={{ padding: 12 }}>{item.durationMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
