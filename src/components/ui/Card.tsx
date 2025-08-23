"use client"

import React from 'react'

type CardVariant = 'default' | 'elevated' | 'interactive'

const variantStyles: Record<CardVariant, string> = {
  default: "bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl shadow-sm",
  elevated: "bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl shadow-lg",
  interactive: "bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer",
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: React.ReactNode
}

export function Card({
  className = '',
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const combinedClassName = [
    variantStyles[variant],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div className={`flex items-center gap-2 mt-4 ${className}`} {...props}>
      {children}
    </div>
  )
}