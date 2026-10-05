import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS, FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { SidebarFrameStyleSlot, SidebarFrameStyleVariant } from './sidebar-frame.style-types'

type SidebarFrameDataSlot = keyof SidebarFrameStyleSlot | 'trigger'

export const sidebarFrameDataAttributes = {
  sidebar: createDataAttributes('closed', 'mobile'),
  trigger: createDataAttributes('closed', 'disabled', 'open'),
  item: createDataAttributes('active', 'disabled', 'mobile'),
} satisfies DataAttributeContract<SidebarFrameDataSlot>

export const sidebarFrameRecipe = /* @__PURE__ */ defineRecipe<
  SidebarFrameStyleSlot,
  SidebarFrameStyleVariant
>('sidebarFrame', {
  base: {
    root: 'flex h-screen max-h-full min-h-0 overflow-hidden',
    sidebar:
      'opacity-100 flex shrink-0 flex-col h-full max-w-[45%] min-h-0 min-w-0 w-(--mo-sidebar-width) translate-x-0 transition-[width,opacity,transform] overflow-hidden data-closed:(opacity-0 w-0 pointer-events-none) data-mobile:(shrink max-w-none w-full) motion-reduce:transition-none [[data-frame-resizable]_&]:border-0!',
    sidebarHeader: 'p-2 flex gap-2',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'p-2 flex gap-2',
    main: 'bg-background flex-1 h-full min-h-0 min-w-0 relative overflow-y-auto',
    group: 'flex flex-col gap-1 w-full',
    groupLabel:
      'text-xs text-muted-foreground tracking-tight font-semibold px-2.5 py-1.5 select-none',
    menu: 'flex flex-col gap-0.5 w-full',
    item: `group text-sm text-muted-foreground font-medium px-2.5 py-1.5 text-left outline-none rounded-lg flex gap-2 w-full cursor-pointer select-none items-center data-active:(text-muted-foreground bg-muted-active) hover:(text-muted-foreground bg-muted-hover) data-mobile:min-h-11 ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
    itemLeading: 'shrink-0 size-4',
    itemLabel: 'flex flex-1 gap-2 min-w-0 items-center',
    itemTrailing:
      'ml-auto shrink-0 size-4 transition-transform duration-200 group-data-[expanded]:rotate-90',
    sub: 'flex flex-col w-full',
    subContent: 'ms-3.5 py-0.5 ps-1 border-l border-border flex flex-col gap-0.5',
    '--mo-sidebar-width': 'var(--sidebar-width, clamp(14rem, 25%, 20rem))',
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
        sidebar: 'border border-border rounded-lg bg-card shadow-surface overflow-hidden',
      },
      inset: {
        root: 'p-2 bg-card',
        main: 'border border-border rounded-xl shadow-surface',
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
