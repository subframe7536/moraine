import { defineRecipe } from '../../theme/style/recipe'

import type { SidebarFrameStyleSlot, SidebarFrameStyleVariant } from './sidebar-frame.style-types'

export const sidebarFrameRecipe = /* @__PURE__ */ defineRecipe<
  SidebarFrameStyleSlot,
  SidebarFrameStyleVariant
>('sidebarFrame', {
  base: {
    root: 'flex h-screen max-h-full min-h-0 overflow-hidden',
    sidebar:
      'opacity-100 flex flex-col h-full min-size-0 translate-x-0 transition-[width,opacity,transform] overflow-hidden data-closed:(opacity-0 w-0 pointer-events-none) motion-reduce:transition-none [[data-frame-resizable]_&]:border-0! w-64 shrink-0 max-w-[45%] data-mobile:(w-full max-w-none shrink)',
    sidebarHeader: 'flex gap-2 p-2',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'flex gap-2 p-2',
    main: 'flex-1 h-full min-h-0 min-w-0 overflow-y-auto bg-background',
  },
  defaultVariants: {
    side: 'left',
    variant: 'default',
  },
  variants: {
    side: {
      left: {
        root: 'flex-row',
        sidebar: 'data-closed:-translate-x-2',
      },
      right: {
        root: 'flex-row-reverse',
        sidebar: 'data-closed:translate-x-2',
      },
    },
    variant: {
      default: {
        root: 'bg-card',
      },
      floating: {
        root: 'p-2 bg-background',
        sidebar: 'bg-card border border-border/80 rounded-lg shadow-sm overflow-hidden',
      },
      inset: {
        root: 'bg-card p-2',
        main: 'rounded-xl border border-border/80 shadow-sm',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'default', side: 'left' },
      sidebar: 'border-r border-border data-mobile:border-0',
    },
    {
      variants: { variant: 'default', side: 'right' },
      sidebar: 'border-l border-border data-mobile:border-0',
    },
  ],
})
