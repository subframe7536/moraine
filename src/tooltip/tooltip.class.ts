import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const tooltipContentVariants = cva(
  'z-50 max-w-72 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md outline-none data-[expanded]:(animate-in fade-in-0 zoom-in-95) data-[state=delayed-open]:(animate-in fade-in-0 zoom-in-95) data-[closed]:(animate-out fade-out-0 zoom-out-95)',
  {
    variants: {
      side: {
        left: 'slide-in-from-right-2 mr-(--kb-popper-content-overflow-padding)',
        right: 'slide-in-from-left-2 ml-(--kb-popper-content-overflow-padding)',
        top: 'slide-in-from-bottom-2 mb-(--kb-popper-content-overflow-padding)',
        bottom: 'slide-in-from-top-2 mt-(--kb-popper-content-overflow-padding)',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  },
)

export const tooltipTextVariants = cva('text-pretty leading-4')

export const tooltipKbdsVariants = cva('ms-1 inline-flex items-center gap-1')

export const tooltipKbdVariants = cva(
  'inline-flex items-center rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none text-muted-foreground uppercase',
)

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
