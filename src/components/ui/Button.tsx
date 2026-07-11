import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm active:scale-[0.98]',
  secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  ghost: 'bg-transparent text-slate-500 dark:text-slate-400',
  danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.98] disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
