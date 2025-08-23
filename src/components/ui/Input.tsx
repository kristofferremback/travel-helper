"use client"

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({
  className = '',
  label,
  error,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-white/90 drop-shadow">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 rounded-lg
          bg-white/20 backdrop-blur-sm border border-white/30
          text-white placeholder-white/60
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
          hover:bg-white/25 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'ring-2 ring-red-400 border-red-400' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({
  className = '',
  label,
  error,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-white/90 drop-shadow">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 rounded-lg
          bg-white/20 backdrop-blur-sm border border-white/30
          text-white placeholder-white/60
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
          hover:bg-white/25 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-vertical
          ${error ? 'ring-2 ring-red-400 border-red-400' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}