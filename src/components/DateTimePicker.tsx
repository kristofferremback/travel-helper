"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function parseLocal(value: string | undefined): Date {
  if (!value) return new Date()
  // Expecting YYYY-MM-DDTHH:MM (local)
  const [date, time] = value.split("T")
  if (!date || !time) return new Date()
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const dt = new Date()
  dt.setFullYear(y)
  dt.setMonth((m || 1) - 1)
  dt.setDate(d || 1)
  dt.setHours(hh || 0, mm || 0, 0, 0)
  return dt
}

function toLocalString(dt: Date): string {
  const yyyy = dt.getFullYear()
  const mm = pad(dt.getMonth() + 1)
  const dd = pad(dt.getDate())
  const HH = pad(dt.getHours())
  const MM = pad(dt.getMinutes())
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`
}

export default function DateTimePicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [internal, setInternal] = useState<Date>(() => parseLocal(value))
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    setInternal(parseLocal(value))
  }, [value])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node | null
      const pop = document.getElementById("dtp-popover")
      if (pop && (pop === t || pop.contains(t as Node))) return
      const a = anchorRef.current
      if (a && (a === t || a.contains(t as Node))) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const monthStart = useMemo(() => {
    const d = new Date(internal)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [internal])

  const monthLabel = monthStart.toLocaleDateString([], { month: "long", year: "numeric" })

  const daysGrid = useMemo(() => {
    const firstDay = new Date(monthStart)
    const startWeekday = (firstDay.getDay() + 6) % 7 // make Monday=0
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()

    const cells: Array<{ date: Date; inMonth: boolean }> = []

    // Leading days
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(monthStart)
      d.setDate(d.getDate() - (startWeekday - i))
      cells.push({ date: d, inMonth: false })
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(monthStart)
      d.setDate(i)
      cells.push({ date: d, inMonth: true })
    }
    // Trailing days to complete 6x7 grid
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date
      const d = new Date(last)
      d.setDate(d.getDate() + 1)
      cells.push({ date: d, inMonth: false })
    }
    // Ensure 6 rows
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      const d = new Date(last)
      d.setDate(d.getDate() + 1)
      cells.push({ date: d, inMonth: false })
    }
    return cells
  }, [monthStart])

  function goMonth(delta: number) {
    const d = new Date(monthStart)
    d.setMonth(d.getMonth() + delta)
    // keep same day if possible
    const sameDay = new Date(d)
    sameDay.setDate(Math.min(internal.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
    sameDay.setHours(internal.getHours(), internal.getMinutes(), 0, 0)
    setInternal(sameDay)
  }

  function selectDay(day: Date) {
    const d = new Date(internal)
    d.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
    setInternal(d)
  }

  function setHour(h: number) {
    const d = new Date(internal)
    d.setHours(h)
    setInternal(d)
  }
  function setMinute(m: number) {
    const d = new Date(internal)
    d.setMinutes(m)
    setInternal(d)
  }

  function commit() {
    onChange(toLocalString(internal))
    setOpen(false)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5) // step 5

  return (
    <div className="relative inline-block" style={{ position: 'relative' }}>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          console.log('DateTimePicker button clicked, current open:', open)
          if (!open && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect()
            setPopoverPosition({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX
            })
          }
          setOpen((v) => !v)
        }}
        className={`border rounded px-2 py-1 bg-white text-gray-900 relative z-10 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {new Date(parseLocal(value)).toLocaleString([], { hour12: false, year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
      </button>
      {open && createPortal(
        <div
          id="dtp-popover"
          role="dialog"
          className="w-[320px] rounded border bg-white shadow-2xl p-3"
          style={{ 
            position: 'absolute',
            top: popoverPosition.top,
            left: popoverPosition.left,
            zIndex: 9999,
            backgroundColor: 'white',
            border: '2px solid #333'
          }}
          ref={(el) => {
            if (el) {
              console.log('Popover rendered at:', el.getBoundingClientRect())
            }
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <button type="button" className="px-2 py-1 hover:bg-gray-100 rounded" onClick={() => goMonth(-1)} aria-label="Previous month">◀</button>
            <div className="font-medium">{monthLabel}</div>
            <button type="button" className="px-2 py-1 hover:bg-gray-100 rounded" onClick={() => goMonth(1)} aria-label="Next month">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {daysGrid.map(({ date, inMonth }, idx) => {
              const isSelected = date.toDateString() === internal.toDateString()
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDay(date)}
                  className={`h-8 text-sm rounded text-center ${
                    isSelected ? "bg-blue-600 text-white" : inMonth ? "hover:bg-gray-100" : "text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm text-gray-600">Time</label>
            <select
              className="border rounded px-2 py-1"
              value={internal.getHours()}
              onChange={(e) => setHour(Number(e.target.value))}
            >
              {hours.map((h) => (
                <option key={h} value={h}>{pad(h)}</option>
              ))}
            </select>
            <span>:</span>
            <select
              className="border rounded px-2 py-1"
              value={Math.floor(internal.getMinutes() / 5) * 5}
              onChange={(e) => setMinute(Number(e.target.value))}
            >
              {minutes.map((m) => (
                <option key={m} value={m}>{pad(m)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1 rounded hover:bg-gray-100" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={commit}>Set</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
