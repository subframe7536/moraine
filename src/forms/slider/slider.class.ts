import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SliderT } from './slider.types.ts'

export const sliderRecipe = /* @__PURE__ */ slotRecipe<SliderT.Slot, SliderT.Variant>({
  base: {
    root: 'group flex select-none items-center relative touch-none data-disabled:(opacity-64 pointer-events-none)',
    track: 'bg-input select-none translate-z-0 relative overflow-hidden',
    range: 'bg-primary select-none absolute z-raised',
    divider: 'pointer-events-none absolute',
    thumb: 'shrink-0 block select-none absolute z-control touch-none',
  },
  defaults: {
    orientation: 'horizontal',
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: { '--s-size': '4px', '--s-thumb-size': '12px' },
      md: { '--s-size': '5px', '--s-thumb-size': '15px' },
      lg: { '--s-size': '6px', '--s-thumb-size': '18px' },
    },
    orientation: {
      horizontal: {
        root: 'w-full',
        track: 'h-(--s-size) w-full',
        range: 'h-full',
        divider: 'h-full w-px top-1/2 -translate-x-1/2 -translate-y-1/2',
        thumb: '-translate-x-1/2 data-inverted:translate-x-1/2',
      },
      vertical: {
        root: 'flex-col h-full',
        track: 'h-full w-(--s-size)',
        range: 'w-full',
        divider: 'h-px w-full left-1/2 -translate-x-1/2 -translate-y-1/2',
        thumb: 'translate-y-1/2 data-inverted:-translate-y-1/2',
      },
    },
    variant: {
      default: {
        track: 'rounded-full',
        range: 'rounded-full',
        divider: 'bg-background',
        thumb:
          'size-(--s-thumb-size) outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:(outline-none ring-3 ring-ring/50) hover:(ring-3 ring-ring/50) dark:bg-foreground data-dragging:scale-120 bg-clip-padding',
      },
      bold: {
        '--s-marker-position': 'max(var(--s-offset), calc(100% - 2 * var(--s-offset)))',
        track: 'cursor-pointer',
        range:
          "rounded-[inherit] transition-[width,height,left,right,top,bottom] after:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:transition-none data-dragging:after:opacity-100 data-multiple:before:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) data-multiple:group-focus-within:before:opacity-100 data-multiple:group-hover:before:opacity-100 data-multiple:data-dragging:before:opacity-100",
        divider: 'bg-muted-foreground/30',
        thumb: 'outline-none opacity-0 cursor-grab data-dragging:cursor-grabbing',
      },
    },
  },
  compoundVariants: [
    {
      variants: { size: 'sm', variant: 'bold' },
      '--s-size': '20px',
      '--s-len': '14px',
      '--s-offset': '3px',
      track: 'rounded-xs',
    },
    {
      variants: { size: 'md', variant: 'bold' },
      '--s-size': '24px',
      '--s-len': '16px',
      '--s-offset': '4px',
      track: 'rounded-sm',
    },
    {
      variants: { size: 'lg', variant: 'bold' },
      '--s-size': '28px',
      '--s-len': '18px',
      '--s-offset': '5px',
      track: 'rounded-md',
    },
    {
      variants: { orientation: 'horizontal', variant: 'bold' },
      range:
        'after:h-(--s-len) after:w-(--s-offset) after:top-1/2 after:-translate-y-1/2 [&:not([data-inverted])]:after:left-(--s-marker-position) data-inverted:after:right-(--s-marker-position) data-multiple:before:h-(--s-len) data-multiple:before:w-(--s-offset) data-multiple:before:top-1/2 data-multiple:before:-translate-y-1/2 [&:not([data-inverted])]:data-multiple:before:left-(--s-offset) data-inverted:data-multiple:before:right-(--s-offset)',
      divider: 'h-1/3',
      thumb: 'h-full top-0 w-(--s-size)',
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      range:
        'after:w-(--s-len) after:h-(--s-offset) after:left-1/2 after:-translate-x-1/2 [&:not([data-inverted])]:after:bottom-(--s-marker-position) data-inverted:after:top-(--s-marker-position) data-multiple:before:w-(--s-len) data-multiple:before:h-(--s-offset) data-multiple:before:left-1/2 data-multiple:before:-translate-x-1/2 [&:not([data-inverted])]:data-multiple:before:bottom-(--s-offset) data-inverted:data-multiple:before:top-(--s-offset)',
      divider: 'w-1/3',
      thumb: 'w-full left-0 h-(--s-size)',
    },
  ],
})
