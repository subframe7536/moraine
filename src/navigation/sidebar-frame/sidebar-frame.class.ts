import type { SlotRecipeOptions, VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { SidebarFrameT } from './sidebar-frame.types.ts'

export const sidebarFrameRecipeOptions = {
  base: {
    root: 'h-screen max-h-full min-h-0 overflow-hidden',
    desktopLayout: 'flex h-full min-h-0',
    sidebar:
      'flex flex-col h-full min-h-0 overflow-hidden transition-[width,opacity,transform] motion-reduce:transition-none opacity-100 translate-x-0 data-closed:opacity-0 data-closed:data-[side=left]:-translate-x-2 data-closed:data-[side=right]:translate-x-2 [[data-frame-resizable]_&]:border-0! duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    sidebarHeader: 'flex gap-2 p-2',
    sidebarBody: 'flex-1 min-h-0 overflow-y-auto',
    sidebarFooter: 'flex gap-2 p-2',
    main: 'flex-1 h-full min-h-0 min-w-0 overflow-y-auto',
  },
  defaultVariants: {
    isMobile: false,
    side: 'left',
    variant: 'default',
  },
  variants: {
    isMobile: {
      true: {},
      false: {
        sidebar: 'shrink-0 max-w-[45%] w-64',
      },
    },
    side: {
      left: {
        desktopLayout: 'flex-row',
      },
      right: {
        desktopLayout: 'flex-row-reverse',
      },
    },
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
      variants: { variant: 'default', isMobile: false, side: 'left' },
      class: {
        sidebar: 'border-r border-border',
      },
    },
    {
      variants: { variant: 'default', isMobile: false, side: 'right' },
      class: {
        sidebar: 'border-l border-border',
      },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof SidebarFrameT.Slot>

export const sidebarFrameRecipe = recipe(sidebarFrameRecipeOptions)

export type SidebarFrameVariantProps = VariantProps<typeof sidebarFrameRecipe>
