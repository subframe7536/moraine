import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS, FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.recipe'
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
      root: 'border flex gap-2 w-full items-start data-closed:(pointer-events-none animate-mo-exit exit-opacity-0 exit-scale-95) motion-reduce:animate-none',
      icon: 'text-base flex shrink-0 size-5 items-center justify-center',
      content: 'flex flex-1 flex-col min-w-0',
      title: 'text-sm leading-5',
      description: 'text-sm text-muted-foreground leading-normal',
      actions: 'flex shrink-0 gap-2 items-center',
      close: `text-muted-foreground rounded-sm inline-flex shrink-0 size-6 cursor-pointer transition-colors items-center justify-center hover:text-foreground ${FOCUS_VISIBLE_RING_CLASS}`,
    },
    defaultVariants: {
      type: 'primary',
      variant: 'subtle',
      fullWidth: false,
    },
    variants: {
      type: {
        primary: TONE_VARS.primary,
        secondary: TONE_VARS.secondary,
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
          root: 'text-tone border-tone-border bg-tone-soft',
        },
        soft: {
          root: 'text-tone border-transparent bg-tone-soft',
        },
        outline: {
          root: 'text-foreground border-tone-border bg-background',
        },
        solid: {
          root: 'text-tone-foreground border-transparent bg-tone',
          title: 'text-tone-foreground',
          description: 'text-tone-foreground opacity-85',
          icon: 'text-tone-foreground',
          actions: 'text-tone-foreground',
          close: 'text-tone-foreground hover:text-tone-foreground',
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
          root: 'p-4',
          title: 'font-bold',
          description: 'mt-1',
        },
        false: {
          root: 'px-4 py-3',
        },
      },
    },
  },
)
