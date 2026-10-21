import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { AlertStyleSlot, AlertStyleVariants } from './alert.style-types'

export const alertDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes(
    'close',
    'closed',
    'expanded',
    'full-width',
    'has-description',
    'type',
  ),
} satisfies DataAttributeContract<keyof AlertStyleSlot>

export const alertRecipe = /* @__PURE__ */ defineRecipe<AlertStyleSlot, AlertStyleVariants>(
  'alert',
  {
    base: {
      root: 'flex gap-3 w-full transition-[opacity,transform] duration-200 ease-out data-closed:(opacity-0 pointer-events-none scale-98)',
      icon: 'flex shrink-0 items-center justify-center',
      content: 'flex flex-1 flex-col min-w-0',
      title: 'leading-snug font-medium',
      description: 'text-muted-foreground leading-normal',
      close:
        'text-muted-foreground rounded-md inline-flex shrink-0 transition-colors items-center justify-center hover:text-foreground focus-visible:(outline-none ring-2 ring-ring) hover:bg-black/5 dark:hover:bg-white/10',
    },
    defaultVariants: {
      type: 'default',
      variant: 'subtle',
      fullWidth: false,
    },
    variants: {
      type: {
        default: {
          ...TONE_VARS.neutral,
        },
        info: {
          ...TONE_VARS.info,
          icon: 'text-info',
        },
        success: {
          ...TONE_VARS.success,
          icon: 'text-success',
        },
        warning: {
          ...TONE_VARS.warning,
          icon: 'text-warning',
        },
        error: {
          ...TONE_VARS.danger,
          icon: 'text-danger',
        },
      },
      variant: {
        subtle: {
          root: 'text-foreground border border-tone-border bg-tone-soft',
        },
        soft: {
          root: 'text-foreground border border-transparent bg-tone-soft',
        },
        outline: {
          root: 'text-foreground border border-tone-border bg-background',
        },
        solid: {
          root: 'text-tone-foreground border border-transparent bg-tone',
          title: 'text-tone-foreground',
          description: 'text-tone-foreground/80',
          icon: 'text-tone-foreground',
          close: 'text-tone-foreground/80 hover:text-tone-foreground',
        },
      },
      fullWidth: {
        true: {
          root: 'border-x-0 rounded-none',
        },
        false: {
          root: 'rounded-lg',
        },
      },
      hasDescription: {
        true: {
          root: 'px-4 py-3 items-start',
          icon: 'text-xl mt-0.5 size-5',
          title: 'text-base font-semibold',
          description: 'text-sm mt-1',
          close: 'size-6 -mr-1 -mt-1',
        },
        false: {
          root: 'px-3 py-2 items-center',
          icon: 'text-base size-4',
          title: 'text-sm',
          description: '',
          close: 'size-5 -mr-1',
        },
      },
    },
  },
)
