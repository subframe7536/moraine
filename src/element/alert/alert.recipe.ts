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
      root: 'flex gap-3 w-full items-start data-closed:(pointer-events-none animate-mo-exit exit-opacity-0 exit-scale-95) motion-reduce:animate-none',
      icon: 'flex shrink-0 items-center justify-center',
      content: 'flex flex-1 flex-col min-w-0',
      title: 'leading-snug font-medium',
      description: 'text-muted-foreground leading-normal',
      actions: 'flex shrink-0 gap-2 items-center',
      close:
        'text-muted-foreground rounded-md inline-flex shrink-0 transition-colors items-center justify-center hover:text-foreground focus-visible:(outline-none ring-2 ring-ring) hover:bg-black/5 dark:hover:bg-white/10',
    },
    defaultVariants: {
      type: 'primary',
      variant: 'subtle',
      fullWidth: false,
    },
    variants: {
      type: {
        primary: {
          ...TONE_VARS.primary,
        },
        secondary: {
          ...TONE_VARS.secondary,
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
          actions: 'text-tone-foreground',
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
          root: 'px-4 py-3.5 items-start',
          icon: 'text-lg mt-0.5 size-5',
          title: 'text-base leading-6 font-semibold',
          description: 'text-sm leading-normal mt-1',
          actions: 'mt-0.5',
          close: 'mt-0.5 size-6',
        },
        false: {
          root: 'px-4 py-3 items-start',
          icon: 'text-base mt-0.5 size-4',
          title: 'text-sm leading-5 font-medium',
          description: '',
          actions: 'mt-0.5',
          close: 'mt-0.5 size-5',
        },
      },
    },
  },
)
