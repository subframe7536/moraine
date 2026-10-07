import {
  DARK_DATA_INVALID_CLASS,
  DATA_INVALID_CLASS,
  FOCUS_CLASS,
  FOCUS_INVALID_CLASS,
  groupAccentClass,
} from '../../theme/recipe-common.class'

const INPUT_GROUP_ACCENT_CLASS = `${groupAccentClass('input-group')}  ${groupAccentClass('input-group', 'placeholder:text-accent-foreground')}`

export const GROUPED_EDGE_CLASS = {
  horizontal: {
    sm: 'pe-0 ps-0 [&:nth-last-child(2)]:pe-1.5 first:ps-1.5',
    md: 'pe-0 ps-0 [&:nth-last-child(2)]:pe-2 first:ps-2',
    lg: 'pe-0 ps-0 [&:nth-last-child(2)]:pe-2.5 first:ps-2.5',
  },
  vertical: {
    sm: 'pb-0 pt-0 [&:nth-last-child(2)]:pb-1 first:pt-1',
    md: 'pb-0 pt-0 [&:nth-last-child(2)]:pb-1.5 first:pt-1.5',
    lg: 'pb-0 pt-0 [&:nth-last-child(2)]:pb-2 first:pt-2',
  },
} as const

export const TEXT_CONTROL_GROUPED = {
  false: {
    root: `${FOCUS_CLASS} ${DATA_INVALID_CLASS} ${DARK_DATA_INVALID_CLASS} ${FOCUS_INVALID_CLASS}`,
  },
  true: {
    root: `peer flex-1 w-0 rounded-none border-0 bg-transparent shadow-none dark:bg-transparent ${INPUT_GROUP_ACCENT_CLASS}`,
  },
} as const

export const TEXT_CONTROL_VARIANT = {
  outline: { root: 'border border-input bg-control shadow-input' },
  subtle: { root: 'border border-input bg-muted shadow-input' },
  ghost: {
    root: 'hover:(bg-accent-hover text-accent-foreground placeholder:text-accent-foreground) focus-within:(bg-accent-hover text-accent-foreground placeholder:text-accent-foreground) [&[type=file]]:hover:text-accent-foreground [&[type=file]]:focus-within:text-accent-foreground',
  },
  none: { root: 'focus:ring-0' },
} as const
