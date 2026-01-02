import React, { useMemo, useRef, useEffect } from "react";
import CHAINS from "./chains";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

// DateMenu builds a fixed list of dates on mount and does not change
// when `selectedDate` changes. The list covers exactly `CHAINS.length` days
// ending on the base date (today at mount time).
export default function DateMenu({ selectedDate, setSelectedDate }) {
  const base = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(base + "T00:00:00"), [base]);
  const count = CHAINS.length;
  const listRef = useRef(null);

  const dates = useMemo(() => {
    const arr = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, [today, count]);

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
        {dates.map((d) => {
          const ds = formatDate(d);
          const label = ds === formatDate(new Date()) ? `Today (${ds})` : ds;
          return (
            <button
              key={ds}
              className={`date-item ${ds === selectedDate ? 'active' : ''}`}
              onClick={() => setSelectedDate(ds)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
