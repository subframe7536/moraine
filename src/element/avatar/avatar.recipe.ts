import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { AvatarStyleSlot, AvatarStyleVariant } from './avatar.style-types'

export const avatarDataAttributes = {
  root: createDataAttributes('status'),
  image: createDataAttributes('status'),
  fallback: createDataAttributes('status'),
} satisfies DataAttributeContract<keyof AvatarStyleSlot>

export const avatarRecipe = /* @__PURE__ */ defineRecipe<AvatarStyleSlot, AvatarStyleVariant>(
  'avatar',
  {
    base: {
      root: "text-muted-foreground rounded-full bg-muted inline-flex shrink-0 select-none items-center justify-center relative overflow-visible after:(border border-border rounded-full pointer-events-none content-[''] inset-0 absolute) dark:after:mix-blend-lighten",
      image:
        'rounded-full opacity-0 size-full pointer-events-none transition-opacity inset-0 absolute object-cover data-[status=loaded]:(opacity-100 pointer-events-auto)',
      fallback:
        'text-muted-foreground font-medium rounded-full bg-muted opacity-100 flex uppercase transition-opacity items-center inset-0 justify-center absolute data-[status=loaded]:(opacity-0 pointer-events-none)',
      fallbackContent: 'shrink-0',
      badge:
        'text-foreground rounded-full bg-background inline-flex pointer-events-none ring-2 ring-background items-center justify-center absolute z-sticky [&>[data-slot=icon]]:text-[0.75em]',
    },
    defaultVariants: {
      size: 'md',
      badgePosition: 'bottom-right',
    },
    variants: {
      size: {
        sm: {
          root: 'text-xs size-6',
          fallback: 'text-xs',
          fallbackContent: 'text-sm',
          badge: 'text-[9px] size-3',
        },
        md: {
          root: 'text-sm size-8',
          fallback: 'text-sm',
          fallbackContent: 'text-base',
          badge: 'text-[10px] size-3.5',
        },
        lg: {
          root: 'text-base size-10',
          fallback: 'text-base',
          fallbackContent: 'text-lg',
          badge: 'text-xs size-4',
        },
      },
      badgePosition: {
        'top-left': { badge: '-left-0.5 -top-0.5' },
        'top-right': { badge: '-right-0.5 -top-0.5' },
        'bottom-left': { badge: '-bottom-0.5 -left-0.5' },
        'bottom-right': { badge: '-bottom-0.5 -right-0.5' },
      },
    },
  },
)
