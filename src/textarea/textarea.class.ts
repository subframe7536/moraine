import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const textareaRootVariants = cva('relative inline-flex w-full')

export const textareaBaseVariants = cva(
  'w-full rounded-md border border-input bg-background text-foreground outline-none transition-shadow placeholder:text-muted-foreground disabled:(cursor-not-allowed opacity-75)',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      variant: 'outline',
      autoresize: false,
    },
    variants: {
      color: {
        primary: 'focus-visible:(ring-2 ring-inset ring-primary)',
        secondary: 'focus-visible:(ring-2 ring-inset ring-secondary)',
        neutral: 'focus-visible:(ring-2 ring-inset ring-neutral)',
        error: 'focus-visible:(ring-2 ring-inset ring-destructive)',
      },
      size: {
        xs: 'min-h-17 px-2 py-1 text-xs',
        sm: 'min-h-18 px-2.5 py-1.5 text-xs',
        md: 'min-h-20 px-2.5 py-1.5 text-sm',
        lg: 'min-h-22 px-3 py-2 text-sm',
        xl: 'min-h-24 px-3 py-2 text-base',
      },
      variant: {
        outline: 'border border-input bg-background',
        soft: 'border-transparent bg-muted/50 hover:bg-muted',
        subtle: 'border border-border bg-muted',
        ghost: 'border-transparent bg-transparent hover:bg-muted',
        none: 'border-transparent bg-transparent',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border',
      },
      leading: {
        true: '',
      },
      trailing: {
        true: '',
      },
      loading: {
        true: '',
      },
      autoresize: {
        true: 'resize-none',
        false: 'resize-y',
      },
      fieldGroup: {
        horizontal: '',
        vertical: '',
      },
    },
    compoundVariants: [
      { color: 'primary', highlight: 'true', class: 'ring-primary' },
      { color: 'secondary', highlight: 'true', class: 'ring-secondary' },
      { color: 'neutral', highlight: 'true', class: 'ring-foreground' },
      { color: 'error', highlight: 'true', class: 'ring-destructive' },
      { leading: 'true', size: 'xs', class: 'ps-7' },
      { leading: 'true', size: 'sm', class: 'ps-8' },
      { leading: 'true', size: 'md', class: 'ps-9' },
      { leading: 'true', size: 'lg', class: 'ps-10' },
      { leading: 'true', size: 'xl', class: 'ps-11' },
      { trailing: 'true', size: 'xs', class: 'pe-7' },
      { trailing: 'true', size: 'sm', class: 'pe-8' },
      { trailing: 'true', size: 'md', class: 'pe-9' },
      { trailing: 'true', size: 'lg', class: 'pe-10' },
      { trailing: 'true', size: 'xl', class: 'pe-11' },
    ],
  },
)

export const textareaLeadingVariants = cva('absolute start-0 flex items-start', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'inset-y-1 ps-2',
      sm: 'inset-y-1.5 ps-2.5',
      md: 'inset-y-1.5 ps-2.5',
      lg: 'inset-y-2 ps-3',
      xl: 'inset-y-2 ps-3',
    },
  },
})

export const textareaTrailingVariants = cva('absolute end-0 flex items-start', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'inset-y-1 pe-2',
      sm: 'inset-y-1.5 pe-2.5',
      md: 'inset-y-1.5 pe-2.5',
      lg: 'inset-y-2 pe-3',
      xl: 'inset-y-2 pe-3',
    },
  },
})

export const textareaLeadingIconVariants = cva('shrink-0 text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
      xl: 'text-lg',
    },
    loading: {
      true: 'animate-spin',
    },
  },
})

export const textareaTrailingIconVariants = cva('shrink-0 text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
      xl: 'text-lg',
    },
    loading: {
      true: 'animate-spin',
    },
  },
})

export const textareaLeadingAvatarVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-4',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-5',
      xl: 'size-6',
    },
  },
})

export type TextareaVariantProps = VariantProps<typeof textareaBaseVariants> &
  VariantProps<typeof textareaLeadingVariants> &
  VariantProps<typeof textareaTrailingVariants> &
  VariantProps<typeof textareaLeadingIconVariants> &
  VariantProps<typeof textareaTrailingIconVariants> &
  VariantProps<typeof textareaLeadingAvatarVariants>
