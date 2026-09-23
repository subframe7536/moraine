import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { useTransitionPresence } from '../../shared/use-transition-presence'

import type { ModalT } from './modal.types'

export interface ModalContext {
  slotName: (slot: string) => string
  readonly presentation: { classes?: ModalT.Classes; styles?: ModalT.Styles }
  open: Accessor<boolean>
  presence: ReturnType<typeof useTransitionPresence>
  contentId: Accessor<string>
  updateOpen: (open: boolean) => void
  dismissible: Accessor<boolean>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  registerContent: (trapFocus: Accessor<boolean>) => () => void
  contentPresent: Accessor<boolean>
  isModal: Accessor<boolean>
}

export const [ModalProvider, useModalContext] = createContextProvider<ModalContext>('Modal')
