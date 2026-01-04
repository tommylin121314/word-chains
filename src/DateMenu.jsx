import React, { useMemo, useEffect, useState } from "react";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import CHAINS from "./chains";
import { differenceInDays } from 'date-fns';


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
  // helpers to parse YYYY-MM-DD and build local Date at midnight
  function parseYMD(ymd) {
    const parts = String(ymd).split('-').map((p) => parseInt(p, 10));
    return parts.length === 3 && parts.every((n) => !Number.isNaN(n)) ? parts : null;
  }
  function localDateFromYMD(y, m, d) {
    return new Date(y, m - 1, d);
  }

  const today = useMemo(() => {
    const parts = parseYMD(base);
    if (!parts) return new Date();
    const [y, m, d] = parts;
    return localDateFromYMD(y, m, d);
  }, [base]);
  const count = CHAINS.length;

  const dates = useMemo(() => {
    const arr = [];
    const startDate = new Date(2026, 0, 1);
    const daysUntilToday = differenceInDays(today, startDate) + 1;
    for (let i = 0; i < daysUntilToday; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [today, count]);

  // Map date string -> status for quick lookup by the date picker
  const statusMap = useMemo(() => {
    const m = new Map();
    dates.forEach((d) => {
      const ds = formatDate(d);
      try {
        const saved = localStorage.getItem(`wordchain-${ds}`);
        if (!saved) { m.set(ds, null); return; }
        const parsed = JSON.parse(saved);
        if (parsed.completed) m.set(ds, 'success');
        else if (parsed.failed) m.set(ds, 'failed');
        else m.set(ds, null);
      } catch (e) {
        m.set(ds, null);
      }
    });
    return m;
  }, [dates, refreshKey]);

  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return today;
    const parts = parseYMD(selectedDate);
    if (!parts) return today;
    const [y, m, d] = parts;
    return localDateFromYMD(y, m, d);
  }, [selectedDate, today]);

  function toISODate(d) {
    if (!d) return null;
    // If it's a JS Date
    if (d instanceof Date) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    // If it's a calendar/date object from @internationalized/date
    if (typeof d.year === 'number' && typeof d.month === 'number' && typeof d.day === 'number') {
      const y = d.year;
      const m = String(d.month).padStart(2, '0');
      const day = String(d.day).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    try {
      return formatDate(new Date(d));
    } catch {
      return null;
    }
  }

  return (
    <div className="side-menu" aria-label="Date menu">
      <div className="date-picker-container">
        <div className="daypicker-wrapper">
          {/* Build arrays of Date objects for status modifiers */}
          {(() => {
            const successDates = [];
            const failedDates = [];
            for (const [ds, st] of statusMap.entries()) {
              if (!ds) continue;
              const parts = parseYMD(ds);
              if (!parts) continue;
              const d = localDateFromYMD(parts[0], parts[1], parts[2]);
              if (st === 'success') successDates.push(d);
              else if (st === 'failed') failedDates.push(d);
            }
            return (
              <DayPicker
                mode="single"
                selected={selectedDateObj}
                onSelect={(d) => {
                  if (!d) return;
                  const iso = toISODate(d);
                  setSelectedDate(iso);
                }}
                disabled={{ before: new Date(2026, 0, 1), after: today }}
                modifiers={{ success: successDates, failed: failedDates }}
                modifiersClassNames={{ success: 'status-success', failed: 'status-failed' }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}
