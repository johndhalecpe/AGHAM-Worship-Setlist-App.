"use client";

import { useState, useRef, useEffect } from "react";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarWeeks(year: number, month: number) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarWeeks: (number | null)[][] = [];
  let currentDay = 1;
  for (let w = 0; w < 6; w++) {
    if (currentDay > totalDaysInMonth) break;
    const weekDays: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if ((w === 0 && d < firstDayOfWeek) || currentDay > totalDaysInMonth) {
        weekDays.push(null);
      } else {
        weekDays.push(currentDay);
        currentDay++;
      }
    }
    calendarWeeks.push(weekDays);
  }
  return calendarWeeks;
}

export default function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value + "T00:00:00") : new Date(2000, 0, 1)
  );
  const [todayDate, setTodayDate] = useState(new Date(2000, 0, 1));
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTodayDate(new Date());
    if (!value) {
      setViewDate(new Date());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = buildCalendarWeeks(year, month);
  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  function formatDisplayDate() {
    if (!value) return "Select a date";
    const d = new Date(value + "T00:00:00");
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function isSelected(day: number) {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  }

  function isDisabled(day: number) {
    if (!minDate) return false;
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}` < minDate;
  }

  function isToday(day: number) {
    return (
      todayDate.getFullYear() === year &&
      todayDate.getMonth() === month &&
      todayDate.getDate() === day &&
      !isSelected(day)
    );
  }

  function selectDay(day: number) {
    if (isDisabled(day)) return;
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${year}-${m}-${d}`);
    setIsOpen(false);
  }

  const isAtMinimumMonth =
    minDate &&
    year * 12 + month <=
      Number(minDate.split("-")[0]) * 12 + Number(minDate.split("-")[1]) - 1;

  function prevMonth() {
    if (isAtMinimumMonth) return;
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors flex items-center gap-2"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: value ? "var(--color-text)" : "var(--color-text-tertiary)",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "#D84F0B")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-border)")
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 shrink-0"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1 text-left">{formatDisplayDate()}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color: "var(--color-text-tertiary)",
            transform: isOpen ? "rotate(180deg)" : "none",
          }}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 rounded-xl p-4 shadow-lg w-full sm:w-72"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg transition-colors"
              style={{
                color: "var(--color-text-secondary)",
                opacity: isAtMinimumMonth ? 0.3 : 1,
                cursor: isAtMinimumMonth ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isAtMinimumMonth) e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = isAtMinimumMonth ? "0.3" : "1";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-2">
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                className="py-1 text-xs font-medium"
                style={{
                  color:
                    i === 0 ? "#D84F0B" : "var(--color-text-tertiary)",
                }}
              >
                {name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((day, i) => {
              const col = i % 7;
              const isSunday = col === 0;

              if (day === null) {
                return <div key={i} />;
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  className="relative w-9 h-9 text-sm rounded-lg transition-all mx-auto"
                  style={{
                    color: isDisabled(day)
                      ? "var(--color-text-tertiary)"
                      : isSelected(day)
                      ? "#fff"
                      : isSunday
                      ? "#D84F0B"
                      : "var(--color-text)",
                    backgroundColor: isSelected(day)
                      ? "#D84F0B"
                      : isToday(day)
                      ? "var(--color-surface-muted)"
                      : "transparent",
                    fontWeight: isSunday ? 600 : 400,
                    opacity: isDisabled(day) ? 0.35 : 1,
                    cursor: isDisabled(day) ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected(day) && !isDisabled(day)) {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-surface-elevated)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected(day)) {
                      e.currentTarget.style.backgroundColor = isToday(day)
                        ? "var(--color-surface-muted)"
                        : "transparent";
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
