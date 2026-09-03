import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const SIDEBAR_FRAME_ROOT_CLASS = 'h-screen max-h-full min-h-0 overflow-hidden'
export const SIDEBAR_FRAME_DESKTOP_SIDEBAR_CLASS =
  'min-h-0 overflow-hidden transition-[width,opacity,transform] motion-reduce:transition-none'
export const SIDEBAR_FRAME_HEADER_CLASS = 'flex gap-2 p-2'
export const SIDEBAR_FRAME_BODY_CLASS = 'flex-1 min-h-0 overflow-y-auto'
export const SIDEBAR_FRAME_FOOTER_CLASS = 'flex gap-2 p-2'

export const sidebarFrameDesktopLayoutVariants = recipe({
  base: 'flex h-full min-h-0',
  defaultVariants: {
    side: 'left',
    variant: 'default',
  },
  variants: {
    side: {
      left: 'flex-row',
      right: 'flex-row-reverse',
    },
    variant: {
      default: '',
      floating: 'p-2 gap-2',
      inset: 'p-2 gap-2',
    },
  },
})

export const sidebarFrameRecipe = recipe({
  slots: [
    'root',
    'desktopLayout',
    'sidebar',
    'sidebarHeader',
    'sidebarBody',
    'sidebarFooter',
    'main',
  ],
  base: {
    root: SIDEBAR_FRAME_ROOT_CLASS,
    desktopLayout: 'flex h-full min-h-0',
    sidebar: 'flex flex-col h-full min-h-0',
    sidebarHeader: SIDEBAR_FRAME_HEADER_CLASS,
    sidebarBody: SIDEBAR_FRAME_BODY_CLASS,
    sidebarFooter: SIDEBAR_FRAME_FOOTER_CLASS,
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
      variant: 'default',
      isMobile: false,
      side: 'left',
      class: {
        sidebar: 'border-r border-border',
      },
    },
    {
      variant: 'default',
      isMobile: false,
      side: 'right',
      class: {
        sidebar: 'border-l border-border',
      },
    },
  ],
})

export type SidebarFrameVariantProps = VariantProps<typeof sidebarFrameRecipe>
