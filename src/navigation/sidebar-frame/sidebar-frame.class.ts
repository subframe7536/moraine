import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

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
      false: '',
    },
    variant: {
      default: '',
      floating: 'b-1 b-border rounded-2xl bg-background shadow-sm overflow-hidden',
      inset: '',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      isMobile: false,
      side: 'left',
      class: 'b-r b-border',
    },
    {
      variant: 'default',
      isMobile: false,
      side: 'right',
      class: 'b-l b-border',
    },
  ],
  defaultVariants: {
    side: 'left',
    variant: 'default',
  },
})

export type SidebarFrameVariantProps = VariantProps<typeof sidebarFrameDesktopLayoutVariants>
