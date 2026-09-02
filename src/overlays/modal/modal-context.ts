import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { useTransitionPresence } from '../../shared/use-transition-presence'

export interface ModalContext {
  open: Accessor<boolean>
  presence: ReturnType<typeof useTransitionPresence>
  contentId: Accessor<string>
  updateOpen: (open: boolean) => void
  dismissible: Accessor<boolean>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  registerContent: () => () => void
  contentPresent: Accessor<boolean>
  isPresent: Accessor<boolean>
}

export const [ModalProvider, useModalContext] = createContextProvider<ModalContext>('Modal')
