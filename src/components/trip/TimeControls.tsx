"use client"

import React from 'react'
import { motion } from 'framer-motion'
import DateTimePicker from '@/components/DateTimePicker'

interface TimeControlsProps {
  useNow: boolean
  setUseNow: (useNow: boolean) => void
  arriveBy: boolean
  setArriveBy: (arriveBy: boolean) => void
  when: string
  setWhen: (when: string) => void
}

export default function TimeControls({
  useNow,
  setUseNow,
  arriveBy,
  setArriveBy,
  when,
  setWhen
}: TimeControlsProps) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 min-h-[3rem]">
        {/* Responsive grid that adapts to content width */}
        <div className="flex flex-col gap-3">
          {/* First row: Radio controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Leave now toggle */}
            <div className="inline-flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={() => setUseNow(!useNow)}>
              <div className="relative">
                <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                  useNow 
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg' 
                    : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
                }`}>
                  {useNow && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>
              <span className="text-white font-medium whitespace-nowrap">Leave now</span>
            </div>

            {/* Time mode options */}
            <motion.div
              initial={false}
              animate={{ 
                opacity: useNow ? 0 : 1,
                x: useNow ? -30 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-4 flex-shrink-0"
              style={{ 
                pointerEvents: useNow ? 'none' : 'auto',
                visibility: useNow ? 'hidden' : 'visible'
              }}
            >
              <RadioOption
                name="timeMode"
                checked={!arriveBy}
                onChange={() => setArriveBy(false)}
                label="Depart at"
              />
              <RadioOption
                name="timeMode"
                checked={arriveBy}
                onChange={() => setArriveBy(true)}
                label="Arrive by"
              />
            </motion.div>

            {/* DateTime picker inline for very wide screens only */}
            <motion.div
              initial={false}
              animate={{ 
                opacity: useNow ? 0 : 1,
                x: useNow ? 20 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
              className="hidden xl:block flex-shrink-0 ml-auto"
              style={{ 
                pointerEvents: useNow ? 'none' : 'auto',
                visibility: useNow ? 'hidden' : 'visible'
              }}
            >
              <DateTimePicker
                value={when}
                onChange={setWhen}
                disabled={useNow}
              />
            </motion.div>
          </div>

          {/* Second row: DateTime picker for most screens */}
          <motion.div
            initial={false}
            animate={{ 
              opacity: useNow ? 0 : 1,
              height: useNow ? 0 : 'auto',
            }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
            className="block xl:hidden"
            style={{ 
              pointerEvents: useNow ? 'none' : 'auto',
              overflow: 'hidden'
            }}
          >
            <DateTimePicker
              value={when}
              onChange={setWhen}
              disabled={useNow}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function RadioOption({ 
  name, 
  checked, 
  onChange, 
  label 
}: { 
  name: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer group">
      <div className="relative">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
          checked 
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg' 
            : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
        }`}>
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-1 bg-white rounded-full"
            />
          )}
        </div>
      </div>
      <span className="text-white font-medium whitespace-nowrap">{label}</span>
    </label>
  )
}