"use client"

import React from 'react'
import { motion } from 'framer-motion'
import DateTimePicker from '@/components/DateTimePicker'

interface TimeSelectionSectionProps {
  useNow: boolean
  when: string
  arriveBy: boolean
  onUseNowChange: (useNow: boolean) => void
  onWhenChange: (when: string) => void
  onArriveByChange: (arriveBy: boolean) => void
}

export default function TimeSelectionSection({
  useNow,
  when,
  arriveBy,
  onUseNowChange,
  onWhenChange,
  onArriveByChange
}: TimeSelectionSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 min-h-[3rem]">
        {/* Leave now toggle */}
        <div
          className="inline-flex items-center gap-3 cursor-pointer group flex-shrink-0"
          onClick={() => onUseNowChange(!useNow)}
        >
          <div className="relative">
            <div
              className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                useNow
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg'
                  : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
              }`}
            >
              {useNow && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </div>
          </div>
          <span className="text-white font-medium whitespace-nowrap">Leave now</span>
        </div>

        {/* Spacer to prevent layout shift */}
        <div className="flex-1 flex items-center gap-4 overflow-hidden">
          {/* Time mode options - fade and slide in */}
          <motion.div
            initial={false}
            animate={{
              opacity: useNow ? 0 : 1,
              x: useNow ? -30 : 0,
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-4 flex-shrink-0"
            style={{
              pointerEvents: useNow ? 'none' : 'auto',
              visibility: useNow ? 'hidden' : 'visible',
            }}
          >
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="radio"
                  name="timeMode"
                  checked={!arriveBy}
                  onChange={() => onArriveByChange(false)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    !arriveBy
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg'
                      : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
                  }`}
                >
                  {!arriveBy && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-1 bg-white rounded-full"
                    />
                  )}
                </div>
              </div>
              <span className="text-white font-medium whitespace-nowrap">Depart at</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="radio"
                  name="timeMode"
                  checked={arriveBy}
                  onChange={() => onArriveByChange(true)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    arriveBy
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg'
                      : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
                  }`}
                >
                  {arriveBy && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-1 bg-white rounded-full"
                    />
                  )}
                </div>
              </div>
              <span className="text-white font-medium whitespace-nowrap">Arrive by</span>
            </label>
          </motion.div>

          {/* DateTime picker - fade and slide from right */}
          <motion.div
            initial={false}
            animate={{
              opacity: useNow ? 0 : 1,
              x: useNow ? 20 : 0,
            }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
            className="ml-auto flex-shrink-0"
            style={{
              pointerEvents: useNow ? 'none' : 'auto',
              visibility: useNow ? 'hidden' : 'visible',
            }}
          >
            <DateTimePicker value={when} onChange={onWhenChange} disabled={useNow} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}