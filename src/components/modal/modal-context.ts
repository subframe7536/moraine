import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createTransitionPresence } from '../../shared/transition-presence'

import type { ModalT } from './modal.types'

export interface ModalContext {
  readonly slotOverrides: { classes?: ModalT.Classes; styles?: ModalT.Styles }
  open: Accessor<boolean>
  presence: ReturnType<typeof createTransitionPresence>
  contentId: Accessor<string>
  updateOpen: (open: boolean) => void
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  setOverlayScroll: (enabled: boolean) => void
  isModal: Accessor<boolean>
  portalMount: Accessor<Node | undefined>
}

export const [ModalProvider, useModalContext] =
  /* @__PURE__ */ createContextProvider<ModalContext>('Modal')

export const MODAL_ROOT_KEYS = [
  'id',
  'open',
  'defaultOpen',
  'onOpenChange',
  'onExitComplete',
  'closeOnOverlayClick',
  'closeOnEscape',
  'onClosePrevent',
  'preventScroll',
  'modal',
  'portalMount',
  'children',
] as const
