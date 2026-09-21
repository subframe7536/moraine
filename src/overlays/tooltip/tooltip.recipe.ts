import { defineRecipe } from '../../theme/style/recipe'

import type { TooltipStyleSlot, TooltipStyleVariant } from './tooltip.style-types'

export const tooltipRecipe = /* @__PURE__ */ defineRecipe<TooltipStyleSlot, TooltipStyleVariant>(
  'tooltip',
  {
    base: {
      trigger: '',
      content:
        'data-instant-motion:data-expanded:animate-none data-instant-motion:data-closed:animate-none text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-(--mo-popper-content-transform-origin) items-center z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=left]:mr-(--mo-popper-content-overflow-padding) data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=right]:ml-(--mo-popper-content-overflow-padding) data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1 data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1',
      text: 'leading-4 text-pretty',
      kbds: 'rounded-sm relative z-floating isolate',
      kbd: '',
    },
    defaultVariants: {
      invert: false,
    },
    variants: {
      invert: {
        true: { content: 'text-background bg-foreground' },
        false: {
          content: 'text-foreground border border-border bg-background shadow-sm',
        },
      },
    },
  },
)
