"use client"

import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
type ButtonSize = 'sm' | 'default' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 hover:scale-105 focus:ring-violet-500",
  secondary: "bg-white/10 hover:bg-white/20 text-white/90 focus:ring-white/50",
  ghost: "bg-white/30 hover:bg-white/50 text-violet-900 focus:ring-violet-500",
  destructive: "text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 focus:ring-rose-500",
  outline: "border border-white/20 bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/20 focus:ring-white/50",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-xs",
  default: "px-3 py-1 text-sm",
  lg: "px-6 py-3 text-sm",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

export function Button({
  className = '',
  variant = 'secondary',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  )
}