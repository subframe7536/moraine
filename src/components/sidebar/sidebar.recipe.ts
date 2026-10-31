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
  menuButton: /* @__PURE__ */ createDataAttributes('active', 'disabled', 'mobile'),
  menuAction: /* @__PURE__ */ createDataAttributes('mobile'),
} satisfies DataAttributeContract<SidebarDataSlot>

/** Shared by `MenuButton` and `MenuSubTrigger`, which renders a `MenuButton`. */
const MENU_BUTTON_CLASS = `text-sm text-muted-foreground px-2 text-left outline-none rounded-md flex gap-2 h-8 min-w-0 w-full cursor-pointer select-none items-center overflow-hidden data-active:(text-accent-foreground font-medium bg-accent) hover:bg-muted-hover data-mobile:h-11 ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`

export const sidebarRecipe = /* @__PURE__ */ defineRecipe<SidebarStyleSlot, SidebarStyleVariants>(
  'sidebar',
  {
    base: {
      root: 'flex h-full min-h-0 w-full overflow-hidden',
      panel:
        'bg-card flex shrink-0 flex-col h-full min-h-0 w-(--mo-sidebar-width) transition-[margin] duration-200 ease-out overflow-hidden data-mobile:(m-0 bg-transparent w-full) motion-reduce:transition-none',
      header: 'p-2 flex shrink-0 gap-2 min-w-0 items-center',
      content: 'flex flex-1 flex-col min-h-0 min-w-0 overflow-y-auto',
      footer: 'p-2 flex shrink-0 gap-2 min-w-0 items-center',
      inset: 'bg-background flex-1 h-full min-h-0 min-w-0 relative overflow-y-auto',
      group: 'p-2 flex flex-col min-w-0 w-full relative',
      groupLabel:
        'text-xs text-muted-foreground font-medium px-2 flex shrink-0 h-8 select-none items-center',
      menu: 'm-0 p-0 list-none flex flex-col gap-0.5 min-w-0 w-full',
      menuItem: 'min-w-0 relative',
      menuButton: MENU_BUTTON_CLASS,
      menuButtonLeading: 'shrink-0',
      menuButtonLabel: 'flex flex-1 gap-2 min-w-0 items-center',
      menuButtonTrailing:
        'ms-auto shrink-0 transition-transform [[data-expanded]>&]:rotate-90 motion-reduce:transition-none rtl:[[data-expanded]>&]:-rotate-90',
      menuAction: 'flex gap-0.5 h-6 items-center end-1 top-1 absolute data-mobile:top-2.5',
      menuSub: 'min-w-0',
      menuSubTrigger: '',
      menuSubContent:
        'ms-3.5 py-0.5 ps-2.5 list-none border-s border-border flex flex-col gap-0.5 min-w-0',
      '--mo-sidebar-width': 'var(--sidebar-width, clamp(14rem, 25%, 20rem))',
      '--mo-sidebar-offset': 'calc(-1 * var(--mo-sidebar-width))',
    },
    defaultVariants: {
      side: 'left',
      variant: 'default',
    },
    variants: {
      side: {
        left: {
          root: 'flex-row',
          panel: 'data-closed:ms-(--mo-sidebar-offset)',
        },
        right: {
          root: 'flex-row-reverse',
          panel: 'data-closed:me-(--mo-sidebar-offset)',
        },
      },
      variant: {
        default: {},
        floating: {
          root: 'p-2 bg-background',
          panel:
            'border border-border rounded-lg shadow-surface data-mobile:(border-0 rounded-none shadow-none)',
          '--mo-sidebar-offset': 'calc(-1 * var(--mo-sidebar-width) - 0.5rem)',
        },
        inset: {
          root: 'p-2 bg-card',
          inset: 'border border-border rounded-xl shadow-surface',
          '--mo-sidebar-offset': 'calc(-1 * var(--mo-sidebar-width) - 0.5rem)',
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
        variants: { variant: ['floating', 'inset'], side: 'left' },
        panel: 'me-2',
      },
      {
        variants: { variant: ['floating', 'inset'], side: 'right' },
        panel: 'ms-2',
      },
    ],
  },
)
