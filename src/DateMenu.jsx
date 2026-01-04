import React, { useMemo, useRef, useEffect } from "react";
import CHAINS from "./chains";

const estFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(d) {
  const parts = estFormatter.formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// DateMenu builds a fixed list of dates on mount and does not change
// when `selectedDate` changes. The list covers exactly `CHAINS.length` days
// ending on the base date (today at mount time).
export default function DateMenu({ selectedDate, setSelectedDate, refreshKey }) {
  const base = useMemo(() => formatDate(new Date()), []);
  const today = useMemo(() => new Date(base + "T00:00:00"), [base]);
  const count = CHAINS.length;
  const listRef = useRef(null);

  const dates = useMemo(() => {
    const arr = [];
    const startDate = "2026-01-01";
    for (let i = 0; i < count; i++) {
      const d = new Date(startDate + "T00:00:00");
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [today, count]);

  // Precompute saved statuses for each date (based on localStorage keys)
  const statuses = useMemo(() => {
    return dates.map((d) => {
      const ds = formatDate(d);
      try {
        const saved = localStorage.getItem(`wordchain-${ds}`);
        if (!saved) return null;
        const parsed = JSON.parse(saved);
        if (parsed.completed) return 'success';
        if (parsed.failed) return 'failed';
        return null;
      } catch (e) {
        return null;
      }
    });
  }, [dates, refreshKey]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector('.date-item.active');
    if (!active) return;
    const containerCenter = container.clientHeight / 2;
    const activeCenter = active.offsetTop + active.offsetHeight / 2;
    const scrollTop = Math.max(0, activeCenter - containerCenter);
    // Smoothly scroll the container so the active item is centered
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    } else {
      container.scrollTop = scrollTop;
    }
  }, [selectedDate, dates]);

  return (
    <div className="side-menu" aria-label="Date menu">
      <h3>Choose Date</h3>
      <div className="date-list" ref={listRef}>
        {dates.map((d, idx) => {
          const ds = formatDate(d);
          const label = ds === formatDate(new Date()) ? `Today (${ds})` : ds;
          const status = statuses[idx];
          return (
            <button
              key={ds}
              className={`date-item ${ds === selectedDate ? 'active' : ''}`}
              onClick={() => setSelectedDate(ds)}
            >
              <span className="date-label">{label}</span>
              <span className={`date-status ${status || ''}`}>{status === 'success' ? '✓' : status === 'failed' ? '✕' : ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
