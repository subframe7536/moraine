import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const buttonRecipe = recipe({
  slots: ['root', 'loading', 'leading', 'label', 'trailing'],
  base: {
    root: 'border inline-flex gap-1.5 cursor-pointer select-none whitespace-nowrap transition-[colors,transform] items-center justify-center bg-clip-padding focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-disabled:opacity-64 aria-disabled:pointer-events-none disabled:opacity-64 disabled:pointer-events-none [&:active:not([aria-haspopup])]:translate-y-px',
    loading: 'cursor-wait opacity-80 animate-spin',
    leading: '',
    label: 'min-w-0 truncate',
    trailing: '',
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    variant: {
      default: {
        root: 'text-primary-foreground border-transparent bg-primary active:bg-primary-active hover:bg-primary-hover',
      },
      secondary: {
        root: 'text-secondary-foreground border-transparent bg-secondary active:bg-secondary-active hover:bg-secondary-hover',
      },
      outline: {
        root: 'border-border bg-background hover:text-foreground hover:bg-background-hover dark:border-input active:bg-background-active',
      },
      ghost: {
        root: 'border-transparent active:text-foreground active:bg-muted-active hover:text-foreground hover:bg-muted-hover',
      },
      link: {
        root: 'text-primary border-transparent underline-offset-4 hover:underline',
      },
      destructive: {
        root: 'text-destructive-foreground border-transparent bg-destructive focus-visible:border-destructive/40 active:bg-destructive-active hover:bg-destructive-hover focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
    },
    size: {
      xs: { root: 'text-xs px-1.5 rounded-md h-6' },
      sm: { root: 'text-sm px-2 rounded-md h-7' },
      md: { root: 'text-sm px-2.5 rounded-lg h-8' },
      lg: { root: 'text-base px-3 rounded-lg h-9' },
      xl: { root: 'text-lg px-4 rounded-lg h-11' },
      'icon-xs': { root: 'text-xs rounded-md size-6' },
      'icon-sm': { root: 'text-sm rounded-md size-7' },
      'icon-md': { root: 'text-sm rounded-lg size-8' },
      'icon-lg': { root: 'text-base rounded-lg size-9' },
      'icon-xl': { root: 'text-lg rounded-lg size-11' },
    },
  },
})

export type ButtonVariantProps = VariantProps<typeof buttonRecipe>
