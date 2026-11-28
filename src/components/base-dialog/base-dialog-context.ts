import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { createTransitionPresence } from '../../shared/transition-presence'

import type { BaseDialogT } from './base-dialog.types'
export interface BaseDialogContext {
  readonly slotOverrides: { classes?: BaseDialogT.Classes; styles?: BaseDialogT.Styles }
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
  mount: Accessor<Element | ShadowRoot | undefined>
  transition: Accessor<boolean>
}

export const [BaseDialogProvider, useBaseDialogContext] =
  /* @__PURE__ */ createContextProvider<BaseDialogContext>('BaseDialog')

export const BASE_DIALOG_ROOT_KEYS = [
  'id',
  'open',
  'defaultOpen',
  'onOpenChange',
  'onExitComplete',
  'transition',
  'closeOnOutsideClick',
  'closeOnEscape',
  'onClosePrevented',
  'preventScroll',
  'modal',
  'mount',
  'initialFocus',
  'finalFocus',
  'children',
] as const
