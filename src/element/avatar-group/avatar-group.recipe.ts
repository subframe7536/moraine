import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { avatarDataAttributes } from '../avatar/avatar.recipe'

import type { AvatarGroupStyleSlot, AvatarGroupStyleVariant } from './avatar-group.style-types'

export const avatarGroupDataAttributes = {
  item: avatarDataAttributes.root,
  image: avatarDataAttributes.image,
  fallback: avatarDataAttributes.fallback,
} satisfies DataAttributeContract<keyof AvatarGroupStyleSlot>

export const avatarGroupRecipe = /* @__PURE__ */ defineRecipe<
  AvatarGroupStyleSlot,
  AvatarGroupStyleVariant
>('avatarGroup', {
  base: {
    root: 'inline-flex flex-row items-center',
    item: 'rounded-full ring-2 ring-background relative z-0 -ms-2 first:ms-0 focus-within:z-10 hover:z-10',
    count:
      'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-2 ring-background items-center justify-center relative z-0 -ms-2 first:ms-0',
    image: '',
    fallback: '',
    fallbackContent: '',
    badge: '',
  },
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: { count: 'text-xs size-6' },
      md: { count: 'text-sm size-8' },
      lg: { count: 'text-base size-10' },
    },
  },
})
