"use client"

import React, {useEffect, useMemo, useRef, useState} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type TypeaheadItem = {
  id: string
  name: string
  type?: string
  fullName?: string
  latitude?: number
  longitude?: number
}

type Props = {
  label: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onSelect: (item: TypeaheadItem) => void
  clearable?: boolean
  onClear?: () => void
}

export default function Typeahead({ label, placeholder, value, onChangeText, onSelect, clearable, onClear }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<TypeaheadItem[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<AbortController | null>(null)
  const debounce = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current)
    const q = query || ''
    if (!q || q.trim().length < 2) {
      setItems([])
      setOpen(false)
      return
    }
    debounce.current = window.setTimeout(async () => {
      try {
        controller.current?.abort()
        controller.current = new AbortController()
        const res = await fetch(`/api/sites/search?q=${encodeURIComponent(q)}`, { signal: controller.current.signal })
        if (!res.ok) return
        const data = await res.json()
        const arr = Array.isArray(data?.results) ? data.results : []
        setItems(arr)
        setOpen(arr.length > 0)
        setActiveIndex(0)
      } catch {}
    }, 150)
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current)
      controller.current?.abort()
    }
  }, [query])

  function handleSelect(i: number) {
    const item = items[i]
    if (!item) return
    onSelect(item)
    setQuery('')
    setItems([])
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) handleSelect(activeIndex)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Auto-scroll active option into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`#ta-opt-${activeIndex}`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function onBlur() {
    // close only if focus leaves both input and list
    setTimeout(() => {
      const root = rootRef.current
      const active = document.activeElement
      if (root && active && root.contains(active)) return
      setOpen(false)
    }, 0)
  }

  return (
    <div ref={rootRef} className="relative" data-ta-root>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls="ta-listbox"
          aria-activedescendant={open && activeIndex >= 0 ? `ta-opt-${activeIndex}` : undefined}
          aria-autocomplete="list"
          className="input pr-8"
          placeholder={placeholder || 'Search stop or address'}
          value={value ?? query}
          onChange={(e) => { const v = e.target.value; setQuery(v); onChangeText?.(v) }}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
        {clearable && (value ?? query) && (
          <button
            type="button"
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setQuery(''); onChangeText?.(''); setItems([]); setOpen(false); onClear?.() }}
          >
            ×
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && items.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            ref={listRef}
            id="ta-listbox"
            role="listbox"
            className="card absolute z-20 mt-1 max-h-72 w-full overflow-auto divide-y bg-white/90 backdrop-blur"
          >
            {items.map((s, i) => (
              <li
                key={s.id}
                id={`ta-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
              >
                <button
                  type="button"
                  className={`w-full text-left p-2 ${i === activeIndex ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(i)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{s.name}</span>
                    {s.type ? <span className="chip capitalize">{s.type}</span> : null}
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
