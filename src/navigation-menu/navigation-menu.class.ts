import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const navigationMenuRootVariants = cva('relative flex gap-1.5 [&>div]:min-w-0', {
  variants: {
    orientation: {
      horizontal: 'items-center justify-between',
      vertical: 'w-full flex-col',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

export const navigationMenuListVariants = cva('min-w-0', {
  variants: {
    orientation: {
      horizontal: 'flex items-center gap-1',
      vertical: 'w-full space-y-1',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

export const navigationMenuLinkVariants = cva(
  'group relative inline-flex min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium outline-none focus-visible:(border-ring ring-3 ring-ring/50) disabled:(cursor-not-allowed opacity-75)',
  {
    variants: {
      orientation: {
        horizontal: '',
        vertical: 'w-full justify-start',
      },
      variant: {
        pill: '',
        link: 'rounded-none bg-transparent',
      },
      color: {
        primary: '',
        neutral: '',
        secondary: '',
        error: '',
      },
      active: {
        true: '',
        false: '',
      },
      disabled: {
        true: 'hover:text-muted-foreground',
        false: '',
      },
      highlight: {
        true: '',
        false: '',
      },
      level: {
        true: 'text-sm',
        false: '',
      },
      collapsed: {
        true: 'justify-center px-1.5',
        false: '',
      },
    },
    compoundVariants: [
      {
        active: true,
        variant: 'pill',
        color: 'primary',
        class: 'bg-primary/10 text-primary',
      },
      {
        active: true,
        variant: 'pill',
        color: 'neutral',
        class: 'bg-accent text-foreground',
      },
      {
        active: true,
        variant: 'pill',
        color: 'secondary',
        class: 'bg-secondary/20 text-secondary',
      },
      {
        active: true,
        variant: 'pill',
        color: 'error',
        class: 'bg-destructive/10 text-destructive',
      },
      {
        active: false,
        disabled: false,
        class: 'text-muted-foreground hover:text-foreground transition-colors',
      },
      {
        variant: 'link',
        active: true,
        color: 'primary',
        class: 'text-primary',
      },
      {
        variant: 'link',
        active: true,
        color: 'neutral',
        class: 'text-foreground',
      },
      {
        variant: 'link',
        active: true,
        color: 'secondary',
        class: 'text-secondary',
      },
      {
        variant: 'link',
        active: true,
        color: 'error',
        class: 'text-destructive',
      },
      {
        variant: 'link',
        active: false,
        disabled: false,
        class: 'text-muted-foreground hover:text-foreground transition-colors',
      },
      {
        highlight: true,
        active: true,
        orientation: 'horizontal',
        class: 'after:absolute after:inset-x-2.5 after:-bottom-1 after:h-px after:bg-current',
      },
      {
        highlight: true,
        active: true,
        orientation: 'vertical',
        class: 'after:absolute after:left-0 after:inset-y-1 after:w-px after:bg-current',
      },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'pill',
      color: 'primary',
      active: false,
      disabled: false,
      highlight: false,
      level: false,
      collapsed: false,
    },
  },
)

export const navigationMenuContentVariants = cva(
  'z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none',
  {
    variants: {
      side: {
        top: 'mb-$kb-popper-content-overflow-padding',
        right: 'ml-$kb-popper-content-overflow-padding',
        bottom: 'mt-$kb-popper-content-overflow-padding',
        left: 'mr-$kb-popper-content-overflow-padding',
      },
      orientation: {
        horizontal: 'min-w-52 p-2',
        vertical: 'w-full p-1.5',
      },
      contentOrientation: {
        horizontal: 'max-w-sm',
        vertical: 'w-60',
      },
    },
    defaultVariants: {
      side: 'bottom',
      orientation: 'horizontal',
      contentOrientation: 'horizontal',
    },
  },
)

export const navigationMenuChildListVariants = cva('grid gap-1', {
  variants: {
    orientation: {
      horizontal: 'grid-cols-1',
      vertical: '',
    },
    contentOrientation: {
      horizontal: 'sm:grid-cols-2',
      vertical: 'grid-cols-1',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    contentOrientation: 'horizontal',
  },
})

export type NavigationMenuVariantProps = VariantProps<typeof navigationMenuRootVariants> &
  VariantProps<typeof navigationMenuListVariants> &
  VariantProps<typeof navigationMenuLinkVariants> &
  VariantProps<typeof navigationMenuContentVariants> &
  VariantProps<typeof navigationMenuChildListVariants>
