import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createTransitionPresence } from '../../shared/transition-presence'
import type { DialogT } from '../dialog/dialog.types'
import type { SheetT } from '../sheet/sheet.types'

import type { ModalT } from './modal.types'

export interface ModalPropsByKind {
  modal: ModalT.Props
  dialog: DialogT.Props
  sheet: SheetT.Props
}

export type ModalKind = keyof ModalPropsByKind

export type ModalConfiguration<K extends ModalKind = ModalKind> = {
  [Kind in K]: { kind: Kind; props: ModalPropsByKind[Kind] }
}[K]

export interface ModalContext {
  configuration: ModalConfiguration
  slotName: (slot: string) => string
  readonly presentation: { classes?: ModalT.Classes; styles?: ModalT.Styles }
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
