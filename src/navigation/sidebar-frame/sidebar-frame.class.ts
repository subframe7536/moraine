import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SidebarFrameT } from './sidebar-frame.types.ts'

export const sidebarFrameRecipe = /* @__PURE__ */ slotRecipe<keyof SidebarFrameT.Slot>({
  base: {
    root: 'flex h-screen max-h-full min-h-0 overflow-hidden',
    sidebar:
      'opacity-100 flex flex-col h-full min-h-0 translate-x-0 transition-[width,opacity,transform] overflow-hidden data-closed:(opacity-0 w-0 pointer-events-none) motion-reduce:transition-none [[data-frame-resizable]_&]:border-0! [&:not([data-mobile])]:(shrink-0 max-w-[45%] w-64)',
    sidebarHeader: 'flex gap-2 p-2',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'flex gap-2 p-2',
    main: 'flex-1 h-full min-h-0 min-w-0 overflow-y-auto',
  },
  defaults: {
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
      default: {},
      floating: {
        root: 'p-2 gap-2',
        sidebar: 'border border-border/80 rounded-lg bg-card shadow-sm overflow-hidden',
      },
      inset: {
        root: 'p-2 gap-2',
        main: 'rounded-xl bg-background shadow-sm',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'default', side: 'left' },
      class: {
        sidebar: '[&:not([data-mobile])]:(border-r border-border)',
      },
    },
    {
      variants: { variant: 'default', side: 'right' },
      class: {
        sidebar: '[&:not([data-mobile])]:(border-l border-border)',
      },
    },
  ],
})
