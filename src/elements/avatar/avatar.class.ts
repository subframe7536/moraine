import { slotRecipe } from '../../shared/style/recipe.ts'

import type { AvatarGroupT } from './avatar-group.types.ts'
import type { AvatarT } from './avatar.types.ts'

export const avatarRecipe = /* @__PURE__ */ slotRecipe<keyof AvatarT.Slot>({
  base: {
    root: "text-muted-foreground rounded-full bg-muted inline-flex shrink-0 select-none items-center justify-center relative overflow-visible after:(border border-border rounded-full pointer-events-none content-[''] inset-0 absolute) dark:after:mix-blend-lighten",
    image:
      'opacity-0 pointer-events-none data-[status=loaded]:(opacity-100 pointer-events-auto) rounded-full size-full transition-opacity inset-0 absolute object-cover',
    fallback:
      'opacity-100 data-[status=loaded]:(opacity-0 pointer-events-none) text-muted-foreground font-medium rounded-full bg-muted flex uppercase transition-opacity items-center inset-0 justify-center absolute',
    fallbackIcon: 'shrink-0',
    badge:
      '[&>[data-slot=root]]:text-[0.75em] text-foreground rounded-full bg-background inline-flex pointer-events-none ring-2 ring-background items-center justify-center absolute z-sticky',
  },
  defaults: {
    size: 'md',
    badgePosition: 'bottom-right',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs size-6',
        fallback: 'text-xs',
        fallbackIcon: 'text-sm',
        badge: 'text-[9px] size-3',
      },
      md: {
        root: 'text-sm size-8',
        fallback: 'text-sm',
        fallbackIcon: 'text-base',
        badge: 'text-[10px] size-3.5',
      },
      lg: {
        root: 'text-base size-10',
        fallback: 'text-base',
        fallbackIcon: 'text-lg',
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
})

export const avatarGroupRecipe = /* @__PURE__ */ slotRecipe<keyof AvatarGroupT.Slot>({
  base: {
    root: 'inline-flex flex-row-reverse justify-end',
    item: 'rounded-full ring-background relative first:me-0',
    count:
      'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center first:me-0',
    image: '',
    fallback: '',
    fallbackIcon: '',
    badge: '',
  },
  defaults: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        item: 'ring-2 -me-2',
        count: 'text-xs size-6 ring-2 -me-2',
      },
      md: {
        item: 'ring-2 -me-2',
        count: 'text-sm size-8 ring-2 -me-2',
      },
      lg: {
        item: 'ring-2 -me-2',
        count: 'text-base size-10 ring-2 -me-2',
      },
    },
  },
})
