"use client"

import React from 'react'

type ChipVariant = 'default' | 'location' | 'recommended' | 'type'
type ChipSize = 'sm' | 'default'

const variantStyles: Record<ChipVariant, string> = {
  default: "bg-white/12 hover:bg-white/20 text-white/95 ring-1 ring-white/20",
  location: "bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/20",
  recommended: "bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white",
  type: "bg-violet-100/80 text-violet-700",
}

const sizeStyles: Record<ChipSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  default: "px-3 py-1 text-xs",
}

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant
  size?: ChipSize
  children: React.ReactNode
  onClick?: () => void
  icon?: React.ReactNode
}

export function Chip({
  className = '',
  variant = 'default',
  size = 'default',
  children,
  icon,
  onClick,
  ...props
}: ChipProps) {
  const baseStyles = "inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap"
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    onClick ? 'cursor-pointer hover:scale-105' : '',
    className
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button
        className={combinedClassName}
        onClick={onClick}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </button>
    )
  }

  return (
    <span className={combinedClassName} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  )
}