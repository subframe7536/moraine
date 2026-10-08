import type { Coords } from '@floating-ui/dom'
import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createPopper } from '../base/popper'

import type { TooltipProps, TooltipT } from './tooltip.types'

export interface TooltipContextValue {
  options: TooltipProps
  popper: ReturnType<typeof createPopper>
  instantMotion: Accessor<boolean>
  initialPosition: Accessor<Coords | undefined>
  scheduleOpen: (fromFocus?: boolean) => void
  scheduleClose: () => void
  dismiss: () => void
  resetPress: () => void
  keepOpen: () => void
  presentation: { classes?: TooltipT.Classes; styles?: TooltipT.Styles }
}

export const [TooltipProvider, useTooltipContext] =
  /* @__PURE__ */ createContextProvider<TooltipContextValue>('Tooltip')
