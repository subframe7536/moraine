import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SidebarFrameT } from './sidebar-frame.types.ts'

export const sidebarFrameRecipe = /* @__PURE__ */ slotRecipe<keyof SidebarFrameT.Slot>({
  base: {
    root: 'flex h-full min-h-0 w-full overflow-hidden',
    sidebar:
      'opacity-100 flex flex-col h-full min-h-0 translate-x-0 transition-[width,opacity,transform] overflow-hidden data-closed:(opacity-0 w-0 pointer-events-none) motion-reduce:transition-none [[data-frame-resizable]_&]:border-0! [&:not([data-mobile])]:(shrink-0 max-w-[45%] w-64)',
    sidebarHeader: 'flex gap-2 p-3 items-center',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'flex gap-2 p-3 items-center',
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
      default: {
        sidebar: 'bg-muted/30 text-foreground',
        main: 'bg-background text-foreground',
      },
      floating: {
        root: 'p-2 gap-2 bg-muted/20',
        sidebar:
          'border border-border/80 rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden',
        main: 'bg-background text-foreground rounded-lg border border-border/60',
      },
      inset: {
        root: 'p-2 gap-2 bg-muted/30',
        sidebar: 'bg-transparent text-foreground',
        main: 'rounded-xl bg-background text-foreground shadow-sm border border-border/60',
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
