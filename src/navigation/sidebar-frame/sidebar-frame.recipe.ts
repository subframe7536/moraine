import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS, FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { SidebarFrameStyleSlot, SidebarFrameStyleVariant } from './sidebar-frame.style-types'

type SidebarFrameDataSlot = keyof SidebarFrameStyleSlot | 'trigger'

export const sidebarFrameDataAttributes = {
  root: createDataAttributes('mobile', 'side', 'variant'),
  sidebar: createDataAttributes('closed', 'expanded', 'mobile', 'side', 'variant'),
  trigger: createDataAttributes('closed', 'disabled', 'open'),
  item: createDataAttributes('active', 'disabled', 'mobile', 'with-actions'),
  itemTrailing: createDataAttributes('expanded'),
} satisfies DataAttributeContract<SidebarFrameDataSlot>

export const sidebarFrameRecipe = /* @__PURE__ */ defineRecipe<
  SidebarFrameStyleSlot,
  SidebarFrameStyleVariant
>('sidebarFrame', {
  base: {
    root: 'flex h-full min-h-0 w-full overflow-hidden',
    sidebar:
      'opacity-100 flex shrink-0 flex-col h-full max-w-[45%] min-h-0 min-w-0 w-(--mo-sidebar-width) translate-x-0 transition-[width,opacity,transform] overflow-hidden data-closed:(opacity-0 w-0 pointer-events-none) data-mobile:(shrink max-w-none w-full) motion-reduce:transition-none',
    sidebarHeader: 'p-2 flex gap-2',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'p-2 flex gap-2',
    main: 'bg-background flex-1 h-full min-h-0 min-w-0 relative overflow-y-auto',
    menu: 'flex flex-col gap-1 w-full',
    label: 'text-xs text-muted-foreground tracking-tight font-semibold px-2.5 py-1.5 select-none',
    item: `text-sm text-muted-foreground font-medium px-2.5 py-1.5 text-left outline-none rounded-lg flex gap-2 w-full cursor-pointer select-none items-center data-with-actions:pe-8 data-active:bg-muted-active hover:bg-muted-hover data-mobile:min-h-11 ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
    itemLeading: 'shrink-0 size-4',
    itemLabel: 'flex flex-1 gap-2 min-w-0 items-center',
    itemTrailing:
      'shrink-0 size-4 transition-transform data-expanded:rotate-90 rtl:data-expanded:-rotate-90',
    itemActions: 'flex gap-0.5 items-center end-1.5 absolute z-1',
    submenu: 'flex flex-col w-full',
    submenuTrigger: `text-muted-foreground p-1 outline-none rounded-md flex shrink-0 size-7 cursor-pointer select-none items-center justify-center hover:bg-muted-hover ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
    submenuContent: 'ms-4.5 py-0.5 ps-1 border-s border-border flex flex-col gap-0.5',
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
      sidebar: 'border-e border-border data-mobile:border-0',
    },
    {
      variants: { variant: 'default', side: 'right' },
      sidebar: 'border-s border-border data-mobile:border-0',
    },
  ],
})

export const SIDEBAR_FRAME_ITEM_CONTAINER_CLASS =
  'group/item flex min-w-0 w-full items-center relative'
