import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS, FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { SidebarStyleSlot, SidebarStyleVariants } from './sidebar.style-types'

type SidebarDataSlot = keyof SidebarStyleSlot | 'trigger'

export const sidebarDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('mobile', 'side', 'variant'),
  panel: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'mobile', 'side', 'variant'),
  trigger: /* @__PURE__ */ createDataAttributes('closed', 'disabled', 'open'),
  menuItem: /* @__PURE__ */ createDataAttributes('active', 'disabled', 'mobile', 'with-action'),
  menuItemTrailing: /* @__PURE__ */ createDataAttributes('expanded'),
} satisfies DataAttributeContract<SidebarDataSlot>

export const sidebarRecipe = /* @__PURE__ */ defineRecipe<SidebarStyleSlot, SidebarStyleVariants>(
  'sidebar',
  {
    base: {
      root: 'flex h-full min-h-0 w-full overflow-hidden',
      panel:
        'opacity-100 flex shrink-0 flex-col h-full max-w-[45%] min-h-0 min-w-0 w-(--mo-sidebar-width) translate-x-0 transition-all overflow-hidden data-closed:(opacity-0 w-0 pointer-events-none) data-mobile:(shrink max-w-none w-full) motion-reduce:transition-none',
      header: 'p-2 flex shrink-0 gap-2 min-w-0 items-center',
      content: 'flex flex-1 flex-col min-h-0 overflow-y-auto',
      footer: 'mt-auto p-2 flex shrink-0 gap-2 min-w-0 items-center',
      inset: 'bg-background flex-1 h-full min-h-0 min-w-0 relative overflow-y-auto',
      group: 'p-2 flex flex-col min-w-0 w-full relative',
      groupLabel:
        'text-xs text-muted-foreground font-medium px-2 flex h-8 select-none items-center',
      menu: 'flex flex-col min-w-0 w-full',
      menuItem: `text-sm text-muted-foreground font-medium px-2 text-left outline-none rounded-lg flex gap-2 h-8 w-full cursor-pointer select-none items-center data-active:(text-foreground bg-muted-active) hover:(text-foreground bg-muted-hover) data-with-action:pe-8 data-mobile:min-h-11 ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
      menuItemLeading: 'shrink-0',
      menuItemLabel: 'flex flex-1 gap-2 min-w-0 items-center',
      menuItemTrailing:
        'shrink-0 transition-transform data-expanded:rotate-90 rtl:data-expanded:-rotate-90',
      menuAction: 'flex gap-0.5 items-center end-1.5 inset-y-0 absolute z-raised',
      menuSub: 'flex flex-col w-full',
      menuSubTrigger: `text-muted-foreground outline-none rounded-md flex shrink-0 size-6 cursor-pointer select-none items-center justify-center hover:bg-muted-hover ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
      menuSubContent: 'ms-4 ps-2 border-s border-border flex flex-col',
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
          panel: 'data-closed:-translate-x-2',
        },
        right: {
          root: 'flex-row-reverse',
          panel: 'data-closed:translate-x-2',
        },
      },
      variant: {
        default: {
          root: 'bg-card',
        },
        floating: {
          root: 'p-2 bg-background',
          panel:
            'border border-border rounded-lg bg-card shadow-surface overflow-hidden data-closed:border-0',
        },
        inset: {
          root: 'p-2 bg-card',
          inset: 'border border-border rounded-xl shadow-surface',
        },
      },
    },
    compoundVariants: [
      {
        variants: { variant: 'default', side: 'left' },
        panel: 'border-e border-border data-mobile:border-0',
      },
      {
        variants: { variant: 'default', side: 'right' },
        panel: 'border-s border-border data-mobile:border-0',
      },
      {
        variants: { variant: 'floating', side: 'left' },
        panel: 'me-2 data-closed:me-0 data-mobile:m-0',
      },
      {
        variants: { variant: 'floating', side: 'right' },
        panel: 'ms-2 data-closed:ms-0 data-mobile:m-0',
      },
    ],
  },
)

export const SIDEBAR_MENU_ITEM_CONTAINER_CLASS =
  'group/menu-item flex min-w-0 w-full items-center relative'
