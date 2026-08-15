import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const avatarRootVariants = cva(
  'text-muted-foreground rounded-full bg-muted inline-flex shrink-0 select-none items-center justify-center relative overflow-visible after:(border border-border rounded-full pointer-events-none content-empty inset-0 absolute) dark:after:mix-blend-lighten',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs size-6',
        sm: 'text-xs size-6',
        md: 'text-sm size-8',
        lg: 'text-base size-10',
        xl: 'text-lg size-11',
      },
    },
  },
)

export const avatarImageVariants = cva(
  'rounded-full size-full transition-opacity ease-out inset-0 absolute object-cover',
  {
    defaultVariants: {
      transition: 'normal',
    },
    variants: {
      transition: {
        none: 'duration-0',
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500',
      },
    },
  },
)

export const avatarFallbackVariants = cva(
  'text-muted-foreground font-medium rounded-full bg-muted flex uppercase transition-opacity ease-out items-center inset-0 justify-center absolute',
  {
    defaultVariants: {
      size: 'md',
      status: 'idle',
      transition: 'normal',
    },
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      },
      status: {
        idle: 'opacity-100',
        loading: 'opacity-100',
        loaded: 'hidden-hitless opacity-0',
        error: 'opacity-100',
      },
      transition: {
        none: 'duration-0',
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500',
      },
    },
  },
)

export const avatarFallbackIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
})

export const avatarBadgeVariants = cva(
  'text-foreground rounded-full bg-background inline-flex pointer-events-none ring-2 ring-background items-center justify-center absolute z-10',
  {
    defaultVariants: {
      size: 'md',
      badgePosition: 'bottom-right',
    },
    variants: {
      size: {
        xs: 'text-[8px] size-2.5',
        sm: 'text-[9px] size-3',
        md: 'text-[10px] size-3.5',
        lg: 'text-xs size-4',
        xl: 'text-sm size-4.5',
      },
      badgePosition: {
        'top-left': '-left-0.5 -top-0.5',
        'top-right': '-right-0.5 -top-0.5',
        'bottom-left': '-bottom-0.5 -left-0.5',
        'bottom-right': '-bottom-0.5 -right-0.5',
      },
    },
  },
)

export const avatarGroupItemVariants = cva('rounded-full ring-background relative first:me-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ring-2 -me-2',
      sm: 'ring-2 -me-2',
      md: 'ring-2 -me-2',
      lg: 'ring-2 -me-2',
      xl: 'ring-2 -me-2',
    },
  },
})

export const avatarGroupCountVariants = cva(
  'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center first:me-0',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs size-6 ring-2 -me-2',
        sm: 'text-xs size-6 ring-2 -me-2',
        md: 'text-sm size-8 ring-2 -me-2',
        lg: 'text-base size-10 ring-2 -me-2',
        xl: 'text-lg size-11 ring-2 -me-2',
      },
    },
  },
)

export type AvatarVariantProps = VariantProps<typeof avatarRootVariants> &
  VariantProps<typeof avatarImageVariants> &
  VariantProps<typeof avatarBadgeVariants>
export type AvatarGroupVariantProps = VariantProps<typeof avatarRootVariants> &
  VariantProps<typeof avatarImageVariants>
