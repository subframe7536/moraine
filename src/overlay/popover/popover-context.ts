import { createContextProvider } from '../../shared/create-context-provider'
import type { createPopper } from '../base/popper'

import type { PopoverProps, PopoverT } from './popover.types'

export interface PopoverContextValue {
  options: PopoverProps
  popper: ReturnType<typeof createPopper>
  scheduleOpen: () => void
  scheduleClose: () => void
  clearCloseTimer: () => void
  invalidateHoverTimers: () => void
  hasClose: () => boolean
  registerClose: () => () => void
  presentation: { classes?: PopoverT.Classes; styles?: PopoverT.Styles }
}

export const [PopoverProvider, usePopoverContext] =
  /* @__PURE__ */ createContextProvider<PopoverContextValue>('Popover')
