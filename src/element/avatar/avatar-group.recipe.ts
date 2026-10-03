import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { AvatarGroupStyleSlot, AvatarGroupStyleVariant } from './avatar-group.style-types'
import { avatarDataAttributes } from './avatar.recipe'

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
    item: 'rounded-full ring-background relative z-0 first:ms-0 focus-within:z-10 hover:z-10',
    count:
      'text-muted-foreground font-medium rounded-full bg-muted inline-flex shrink-0 ring-background items-center justify-center relative z-0 first:ms-0',
    image: '',
    fallback: '',
    fallbackContent: '',
    badge: '',
  },
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: { item: 'ring-2 -ms-2', count: 'text-xs size-6 ring-2 -ms-2' },
      md: { item: 'ring-2 -ms-2', count: 'text-sm size-8 ring-2 -ms-2' },
      lg: { item: 'ring-2 -ms-2', count: 'text-base size-10 ring-2 -ms-2' },
    },
  },
})
