import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-ink text-ink-inverse hover:bg-ink/90 border border-ink',
  secondary: 'bg-transparent text-ink border border-base-border hover:border-ink/40 hover:bg-base-surface',
  ghost: 'bg-transparent text-ink-secondary hover:text-ink hover:bg-base-surface border border-transparent',
  gold: 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 hover:border-gold/50',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium',
          'rounded transition-all duration-150 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'select-none whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
