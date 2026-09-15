"use client";

import { useState } from "react";
import type { StudentActivityReportData } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import {
  formatAxisDuration,
  formatDuration,
  formatShortDate,
} from "../../utils/activityReportFormatting";

export const ActivityTrendChart = ({
  points,
}: {
  points: StudentActivityReportData["analytics"]["dailyTrend"];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points.length) {
    return (
      <div className={styles.chartEmpty}>
        No learning-resource duration in this range.
      </div>
    );
  }
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [
      point.activeDurationSeconds,
      point.idleDurationSeconds,
    ]),
  );
  const chart = {
    bottom: 178,
    height: 158,
    left: 50,
    right: 682,
    top: 20,
    width: 632,
  };
  const x = (index: number) =>
    points.length === 1
      ? chart.left + chart.width / 2
      : chart.left + (index / (points.length - 1)) * chart.width;
  const y = (value: number) => chart.bottom - (value / maxValue) * chart.height;
  const activePoints = points
    .map((point, index) => `${x(index)},${y(point.activeDurationSeconds)}`)
    .join(" ");
  const idlePoints = points
    .map((point, index) => `${x(index)},${y(point.idleDurationSeconds)}`)
    .join(" ");
  const labelIndexes = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ];
  const activeHoverIndex =
    hoveredIndex !== null && hoveredIndex < points.length ? hoveredIndex : null;
  const hoveredPoint =
    activeHoverIndex === null ? null : points[activeHoverIndex];

  return (
    <div
      className={styles.trendChart}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <svg
        aria-label="Active and idle resource time trend"
        role="img"
        viewBox="0 0 700 225"
      >
        <defs>
          <linearGradient id="activeArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#14b8a6" stopOpacity="0.32" />
            <stop offset="1" stopColor="#14b8a6" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="idleArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const lineY = chart.bottom - ratio * chart.height;
          return (
            <g key={ratio}>
              <line
                className={styles.gridLine}
                x1={chart.left}
                x2={chart.right}
                y1={lineY}
                y2={lineY}
              />
              <text
                className={styles.yAxisLabel}
                textAnchor="end"
                x={chart.left - 10}
                y={lineY + 4}
              >
                {formatAxisDuration(maxValue * ratio)}
              </text>
            </g>
          );
        })}
        <polygon
          fill="url(#activeArea)"
          points={`${chart.left},${chart.bottom} ${activePoints} ${chart.right},${chart.bottom}`}
        />
        <polygon
          fill="url(#idleArea)"
          points={`${chart.left},${chart.bottom} ${idlePoints} ${chart.right},${chart.bottom}`}
        />
        <polyline
          className={styles.activeLine}
          fill="none"
          points={activePoints}
        />
        <polyline className={styles.idleLine} fill="none" points={idlePoints} />
        {activeHoverIndex !== null ? (
          <line
            className={styles.hoverGuide}
            x1={x(activeHoverIndex)}
            x2={x(activeHoverIndex)}
            y1={chart.top}
            y2={chart.bottom}
          />
        ) : null}
        {points.map((point, index) => {
          const selected = index === activeHoverIndex;
          const hitWidth = Math.max(
            28,
            chart.width / Math.max(points.length, 1),
          );
          return (
            <g key={point.date}>
              <circle
                className={styles.activePoint}
                cx={x(index)}
                cy={y(point.activeDurationSeconds)}
                r={selected ? 5 : 3.5}
              />
              <circle
                className={styles.idlePoint}
                cx={x(index)}
                cy={y(point.idleDurationSeconds)}
                r={selected ? 5 : 3.5}
              />
              <rect
                aria-label={`${formatShortDate(point.date)}: ${formatDuration(point.activeDurationSeconds)} active, ${formatDuration(point.idleDurationSeconds)} idle`}
                className={styles.chartHitZone}
                height={chart.height + 18}
                onBlur={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                tabIndex={0}
                width={hitWidth}
                x={x(index) - hitWidth / 2}
                y={chart.top - 9}
              />
            </g>
          );
        })}
        {labelIndexes.map((index) => (
          <text
            className={styles.axisLabel}
            key={index}
            textAnchor={
              index === 0
                ? "start"
                : index === points.length - 1
                  ? "end"
                  : "middle"
            }
            x={x(index)}
            y="211"
          >
            {formatShortDate(points[index].date)}
          </text>
        ))}
      </svg>
      {hoveredPoint && activeHoverIndex !== null ? (
        <div
          className={styles.chartTooltip}
          style={{
            left: `${Math.min(88, Math.max(12, (x(activeHoverIndex) / 700) * 100))}%`,
          }}
        >
          <strong>{formatShortDate(hoveredPoint.date)}</strong>
          <span>
            <i style={{ background: "#14b8a6" }} />
            Active time
            <b>{formatDuration(hoveredPoint.activeDurationSeconds)}</b>
          </span>
          <span>
            <i style={{ background: "#f59e0b" }} />
            Idle time
            <b>{formatDuration(hoveredPoint.idleDurationSeconds)}</b>
          </span>
        </div>
      ) : null}
    </div>
  );
};
