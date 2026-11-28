import type { Coords } from '@floating-ui/dom'
import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createPopper } from '../shared/overlay/popper'

import type { HoverCardProps, HoverCardT } from './hover-card.types'
export interface HoverCardContextValue {
  options: HoverCardProps
  popper: ReturnType<typeof createPopper>
  instantMotion: Accessor<boolean>
  openedByTrigger: Accessor<boolean>
  inlinePoint: Accessor<Coords | undefined>
  activeValue: Accessor<string | undefined>
  /** Anchors the card to the given trigger and records its `value`. */
  activateTrigger: (value: string | undefined, element: HTMLElement) => void
  scheduleOpen: (fromFocus?: boolean) => void
  scheduleClose: () => void
  cancelClose: () => void
  recordPoint: (x: number, y: number) => void
  markInstantClose: () => void
  slotOverrides: { classes?: HoverCardT.Classes; styles?: HoverCardT.Styles }
}

export const [HoverCardProvider, useHoverCardContext] =
  /* @__PURE__ */ createContextProvider<HoverCardContextValue | null>('HoverCard', null)
