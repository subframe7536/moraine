import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { DisclosureState } from '../../shared/disclosure-state'

import type { CollapsibleT } from './collapsible.types'

export interface CollapsibleContext {
  slotOverrides: { readonly classes?: CollapsibleT.Classes; readonly styles?: CollapsibleT.Styles }
  triggerId: Accessor<string>
  contentId: Accessor<string>
  toggle: () => void
  disclosure: DisclosureState
}

export const [CollapsibleProvider, useCollapsibleContext] =
  /* @__PURE__ */ createContextProvider<CollapsibleContext | null>('Collapsible', null)
