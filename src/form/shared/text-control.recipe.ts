import {
  DARK_DATA_INVALID_CLASS,
  DATA_INVALID_CLASS,
  FOCUS_CLASS,
  FOCUS_INVALID_CLASS,
} from '../../theme/recipe-common.class'
export const TEXT_CONTROL_GROUPED = {
  false: {
    root: `${FOCUS_CLASS} ${DATA_INVALID_CLASS} ${DARK_DATA_INVALID_CLASS} ${FOCUS_INVALID_CLASS}`,
  },
  true: {
    root: 'peer flex-1 w-0 rounded-none border-0 bg-transparent shadow-none dark:bg-transparent group-hover/input-group:text-accent-foreground group-focus-within/input-group:text-accent-foreground group-hover/input-group:placeholder:text-accent-foreground group-focus-within/input-group:placeholder:text-accent-foreground',
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
