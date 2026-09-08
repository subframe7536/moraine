import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { SidebarFrameT } from './sidebar-frame.types.ts'

export const sidebarFrameRecipeOptions = {
  base: {
    root: 'h-screen max-h-full min-h-0 overflow-hidden',
    desktopLayout: /* @__PURE__ */ cn(
      'flex h-full min-h-0',
      'data-[side=left]:flex-row data-[side=right]:flex-row-reverse',
    ),
    sidebar: /* @__PURE__ */ cn(
      'opacity-100 flex flex-col h-full min-h-0 translate-x-0 transition-[width,opacity,transform] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden data-closed:opacity-0 data-closed:w-0 data-closed:pointer-events-none motion-reduce:transition-none [[data-frame-resizable]_&]:border-0! data-closed:data-[side=right]:translate-x-2 data-closed:data-[side=left]:-translate-x-2',
      '[&:not([data-mobile])]:shrink-0 [&:not([data-mobile])]:max-w-[45%] [&:not([data-mobile])]:w-64',
    ),
    sidebarHeader: 'flex gap-2 p-2',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'flex gap-2 p-2',
    main: 'flex-1 h-full min-h-0 min-w-0 overflow-y-auto',
  },
  defaults: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: {},
      floating: {
        desktopLayout: 'p-2 gap-2',
        sidebar: 'border border-border/80 rounded-lg bg-card shadow-sm overflow-hidden',
      },
      inset: {
        desktopLayout: 'p-2 gap-2',
        main: 'rounded-xl bg-background shadow-sm',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'default' },
      class: {
        sidebar:
          '[&:not([data-mobile])]:data-[side=left]:border-r [&:not([data-mobile])]:data-[side=left]:border-border',
      },
    },
    {
      variants: { variant: 'default' },
      class: {
        sidebar:
          '[&:not([data-mobile])]:data-[side=right]:border-l [&:not([data-mobile])]:data-[side=right]:border-border',
      },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof SidebarFrameT.Slot>

export const sidebarFrameRecipe = /* @__PURE__ */ slotRecipe(sidebarFrameRecipeOptions)
