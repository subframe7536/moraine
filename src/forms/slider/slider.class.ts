import { defineStyleVars } from '../../shared/style/css-vars.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const sliderStyleVars = defineStyleVars({
  prefix: 's',
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: { size: '4px' },
      md: { size: '5px' },
      lg: { size: '6px' },
    },
    variant: {
      default: {},
      bold: {},
    },
  },
  compoundVariants: [
    {
      variants: { size: 'sm', variant: 'bold' },
      vars: {
        size: '20px',
        len: '14px',
        offset: '3px',
        pos: 'max(3px, calc(100% - 6px))',
      },
    },
    {
      variants: { size: 'md', variant: 'bold' },
      vars: {
        size: '24px',
        len: '16px',
        offset: '4px',
        pos: 'max(4px, calc(100% - 8px))',
      },
    },
    {
      variants: { size: 'lg', variant: 'bold' },
      vars: {
        size: '28px',
        len: '18px',
        offset: '5px',
        pos: 'max(5px, calc(100% - 10px))',
      },
    },
  ],
})

export const sliderRecipe = recipe({
  slots: ['root', 'track', 'range', 'divider', 'thumb'],
  base: {
    root: 'group flex select-none items-center relative touch-none data-disabled:opacity-64 data-disabled:pointer-events-none',
    track: 'bg-input select-none translate-z-0 relative overflow-hidden',
    range: 'bg-primary select-none absolute z-raised',
    divider: 'pointer-events-none absolute',
    thumb: 'shrink-0 block select-none absolute z-control touch-none',
  },
  defaultVariants: {
    orientation: 'horizontal',
    size: 'md',
    variant: 'default',
    inverted: false,
    multiple: false,
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'w-full',
        track: 'h-[var(--s-size)] w-full',
        range: 'h-full',
        divider: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      vertical: {
        root: 'flex-col h-full',
        track: 'h-full w-[var(--s-size)]',
        range: 'w-full',
        divider: 'left-1/2 -translate-x-1/2 -translate-y-1/2',
      },
    },
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    variant: {
      default: {
        track: 'rounded-full',
        range: 'rounded-full',
        divider: 'bg-background',
        thumb:
          'outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:ring-3 hover:ring-ring/50 dark:bg-foreground data-dragging:scale-120 not-dark:bg-clip-padding',
      },
      bold: {
        track: 'cursor-pointer',
        range:
          "rounded-[inherit] transition-[width,height,left,right,top,bottom] after:rounded-full after:bg-primary-foreground/90 after:opacity-0 after:content-[''] after:transition-opacity after:absolute group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:transition-none",
        divider: 'bg-muted-foreground/30',
        thumb: 'outline-none opacity-0 cursor-grab data-dragging:cursor-grabbing',
      },
    },
    inverted: {
      true: {},
      false: {},
    },
    multiple: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variants: { size: 'sm', variant: 'bold' },
      class: { track: 'rounded-xs' },
    },
    {
      variants: { size: 'md', variant: 'bold' },
      class: { track: 'rounded-sm' },
    },
    {
      variants: { size: 'lg', variant: 'bold' },
      class: { track: 'rounded-md' },
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold' },
      class: {
        range:
          'after:h-[var(--s-len)] after:w-[var(--s-offset)] after:top-1/2 after:-translate-y-1/2 after:left-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold' },
      class: {
        range:
          'after:h-[var(--s-len)] after:w-[var(--s-offset)] after:top-1/2 after:-translate-y-1/2 after:right-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold' },
      class: {
        range:
          'after:w-[var(--s-len)] after:h-[var(--s-offset)] after:left-1/2 after:-translate-x-1/2 after:bottom-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold' },
      class: {
        range:
          'after:w-[var(--s-len)] after:h-[var(--s-offset)] after:left-1/2 after:-translate-x-1/2 after:top-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:h-[var(--s-len)] before:w-[var(--s-offset)] before:top-1/2 before:-translate-y-1/2 before:left-[var(--s-offset)]",
      },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:h-[var(--s-len)] before:w-[var(--s-offset)] before:top-1/2 before:-translate-y-1/2 before:right-[var(--s-offset)]",
      },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:w-[var(--s-len)] before:h-[var(--s-offset)] before:left-1/2 before:-translate-x-1/2 before:bottom-[var(--s-offset)]",
      },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:w-[var(--s-len)] before:h-[var(--s-offset)] before:left-1/2 before:-translate-x-1/2 before:top-[var(--s-offset)]",
      },
    },
    {
      variants: { orientation: 'horizontal', variant: 'default' },
      class: { divider: 'h-full w-px' },
    },
    {
      variants: { orientation: 'vertical', variant: 'default' },
      class: { divider: 'h-px w-full' },
    },
    {
      variants: { orientation: 'horizontal', variant: 'bold' },
      class: { divider: 'h-1/3 w-px' },
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      class: { divider: 'h-px w-1/3' },
    },
    {
      variants: { size: 'sm', variant: 'default' },
      class: { thumb: 'size-3' },
    },
    {
      variants: { size: 'md', variant: 'default' },
      class: { thumb: 'size-3.5' },
    },
    {
      variants: { size: 'lg', variant: 'default' },
      class: { thumb: 'size-4' },
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'default' },
      class: { thumb: '-translate-x-1/2' },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'default' },
      class: { thumb: 'translate-x-1/2' },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'default' },
      class: { thumb: 'translate-y-1/2' },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'default' },
      class: { thumb: '-translate-y-1/2' },
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold' },
      class: { thumb: 'h-full top-0 -translate-x-1/2 w-[var(--s-size)]' },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold' },
      class: { thumb: 'h-full top-0 translate-x-1/2 w-[var(--s-size)]' },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold' },
      class: { thumb: 'w-full left-0 translate-y-1/2 h-[var(--s-size)]' },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold' },
      class: { thumb: 'w-full left-0 -translate-y-1/2 h-[var(--s-size)]' },
    },
  ],
})

export const sliderRootVariants = recipe({
  base: 'group flex select-none items-center relative touch-none data-disabled:opacity-64 data-disabled:pointer-events-none',
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'w-full',
      vertical: 'flex-col h-full',
    },
  },
})

export const sliderTrackVariants = recipe({
  base: 'bg-input select-none translate-z-0 relative overflow-hidden',
  defaultVariants: {
    size: 'md',
    orientation: 'horizontal',
    variant: 'default',
  },
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    variant: {
      default: 'rounded-full',
      bold: 'cursor-pointer',
    },
    orientation: {
      horizontal: 'h-[var(--s-size)] w-full',
      vertical: 'h-full w-[var(--s-size)]',
    },
  },
  compoundVariants: [
    { size: 'sm', variant: 'bold', class: 'rounded-xs' },
    { size: 'md', variant: 'bold', class: 'rounded-sm' },
    { size: 'lg', variant: 'bold', class: 'rounded-md' },
  ],
})

export const sliderRangeVariants = recipe({
  base: 'bg-primary select-none absolute z-raised',
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
    inverted: false,
    multiple: false,
  },
  variants: {
    orientation: {
      horizontal: 'h-full',
      vertical: 'w-full',
    },
    variant: {
      default: 'rounded-full',
      bold: "rounded-[inherit] transition-[width,height,left,right,top,bottom] after:rounded-full after:bg-primary-foreground/90 after:opacity-0 after:content-[''] after:transition-opacity after:absolute group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:transition-none",
    },
    inverted: {
      true: '',
      false: '',
    },
    multiple: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold' },
      class:
        'after:h-[var(--s-len)] after:w-[var(--s-offset)] after:top-1/2 after:-translate-y-1/2 after:left-[var(--s-pos)]',
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold' },
      class:
        'after:h-[var(--s-len)] after:w-[var(--s-offset)] after:top-1/2 after:-translate-y-1/2 after:right-[var(--s-pos)]',
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold' },
      class:
        'after:w-[var(--s-len)] after:h-[var(--s-offset)] after:left-1/2 after:-translate-x-1/2 after:bottom-[var(--s-pos)]',
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold' },
      class:
        'after:w-[var(--s-len)] after:h-[var(--s-offset)] after:left-1/2 after:-translate-x-1/2 after:top-[var(--s-pos)]',
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold', multiple: true },
      class:
        "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:h-[var(--s-len)] before:w-[var(--s-offset)] before:top-1/2 before:-translate-y-1/2 before:left-[var(--s-offset)]",
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold', multiple: true },
      class:
        "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:h-[var(--s-len)] before:w-[var(--s-offset)] before:top-1/2 before:-translate-y-1/2 before:right-[var(--s-offset)]",
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold', multiple: true },
      class:
        "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:w-[var(--s-len)] before:h-[var(--s-offset)] before:left-1/2 before:-translate-x-1/2 before:bottom-[var(--s-offset)]",
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold', multiple: true },
      class:
        "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:w-[var(--s-len)] before:h-[var(--s-offset)] before:left-1/2 before:-translate-x-1/2 before:top-[var(--s-offset)]",
    },
  ],
})

export const sliderDividerVariants = recipe({
  base: 'pointer-events-none absolute',
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
  variants: {
    orientation: {
      horizontal: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
      vertical: 'left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    variant: {
      default: 'bg-background',
      bold: 'bg-muted-foreground/30',
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', variant: 'default' },
      class: 'h-full w-px',
    },
    {
      variants: { orientation: 'vertical', variant: 'default' },
      class: 'h-px w-full',
    },
    {
      variants: { orientation: 'horizontal', variant: 'bold' },
      class: 'h-1/3 w-px',
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      class: 'h-px w-1/3',
    },
  ],
})

export const sliderThumbVariants = recipe({
  base: 'shrink-0 block select-none absolute z-control touch-none',
  defaultVariants: {
    orientation: 'horizontal',
    inverted: false,
    size: 'md',
    variant: 'default',
  },
  variants: {
    orientation: {
      horizontal: '',
      vertical: '',
    },
    inverted: {
      true: '',
      false: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    variant: {
      default:
        'outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:ring-3 hover:ring-ring/50 dark:bg-foreground data-dragging:scale-120 not-dark:bg-clip-padding',
      bold: 'outline-none opacity-0 cursor-grab data-dragging:cursor-grabbing',
    },
  },
  compoundVariants: [
    { variants: { size: 'sm', variant: 'default' }, class: 'size-3' },
    { variants: { size: 'md', variant: 'default' }, class: 'size-3.5' },
    { variants: { size: 'lg', variant: 'default' }, class: 'size-4' },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'default' },
      class: '-translate-x-1/2',
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'default' },
      class: 'translate-x-1/2',
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'default' },
      class: 'translate-y-1/2',
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'default' },
      class: '-translate-y-1/2',
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold' },
      class: 'h-full top-0 -translate-x-1/2 w-[var(--s-size)]',
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold' },
      class: 'h-full top-0 translate-x-1/2 w-[var(--s-size)]',
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold' },
      class: 'w-full left-0 translate-y-1/2 h-[var(--s-size)]',
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold' },
      class: 'w-full left-0 -translate-y-1/2 h-[var(--s-size)]',
    },
  ],
})

export type SliderVariantProps = VariantProps<typeof sliderRecipe>
