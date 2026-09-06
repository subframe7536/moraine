import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { useTransitionPresence } from '../../shared/use-transition-presence.ts'

export interface CollapsibleContext {
  rootId: Accessor<string>
  triggerId: Accessor<string>
  contentId: Accessor<string>
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  toggle: () => void
  disabled: Accessor<boolean>
  transition: Accessor<boolean>
  unmountOnHide: Accessor<boolean>
  dataAttrs: Accessor<{
    'data-closed'?: string
    'data-disabled'?: string
    'data-expanded'?: string
  }>
  contentHeight: Accessor<number>
  setContentElement: (element: HTMLDivElement | undefined) => void
  contentPresence: ReturnType<typeof useTransitionPresence>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
}

export const [CollapsibleProvider, useCollapsibleContext] =
  createContextProvider<CollapsibleContext>('Collapsible')
