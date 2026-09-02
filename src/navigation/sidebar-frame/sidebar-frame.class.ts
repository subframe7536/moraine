import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const SIDEBAR_FRAME_ROOT_CLASS = 'h-screen max-h-full min-h-0 overflow-hidden'
export const SIDEBAR_FRAME_DESKTOP_SIDEBAR_CLASS =
  'min-h-0 overflow-hidden transition-[width,opacity,transform] motion-reduce:transition-none'
export const SIDEBAR_FRAME_HEADER_CLASS = 'flex gap-2 p-2'
export const SIDEBAR_FRAME_BODY_CLASS = 'flex-1 min-h-0 overflow-y-auto'
export const SIDEBAR_FRAME_FOOTER_CLASS = 'flex gap-2 p-2'

export const sidebarFrameDesktopLayoutVariants = cva('flex h-full min-h-0', {
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
  defaultVariants: {
    side: 'left',
    variant: 'default',
  },
})

export const sidebarFrameSidebarVariants = cva('flex flex-col h-full min-h-0', {
  variants: {
    side: {
      left: '',
      right: '',
    },
    isMobile: {
      true: '',
      false: 'shrink-0 max-w-[45%] w-64',
    },
    variant: {
      default: '',
      floating: 'border border-border/80 rounded-lg bg-card shadow-sm overflow-hidden',
      inset: '',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      isMobile: false,
      side: 'left',
      class: 'border-r border-border',
    },
    {
      variant: 'default',
      isMobile: false,
      side: 'right',
      class: 'border-l border-border',
    },
  ],
  defaultVariants: {
    side: 'left',
    variant: 'default',
  },
})

export const sidebarFrameMainVariants = cva('flex-1 h-full min-h-0 min-w-0 overflow-y-auto', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: '',
      floating: '',
      inset: 'rounded-xl bg-background shadow-sm',
    },
  },
})

export type SidebarFrameVariantProps = VariantProps<typeof sidebarFrameDesktopLayoutVariants>
