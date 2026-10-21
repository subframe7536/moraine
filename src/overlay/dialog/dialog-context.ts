import { createSignal } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { createContentAnatomy } from '../base/content-anatomy'

import type { DialogT } from './dialog.types'

export interface DialogContextValue {
  readonly slotOverrides: { classes?: DialogT.Classes; styles?: DialogT.Styles }
  overlay?: boolean
  fullscreen?: boolean | null
  scrollable?: boolean | null
  closable?: boolean
  closeIcon?: DialogT.Base['closeIcon']
  translations?: DialogT.Translations
}

export const [DialogProvider, useDialogContext] =
  /* @__PURE__ */ createContextProvider<DialogContextValue>('Dialog')

export function createDialogContentRegistration() {
  const registration = createContentAnatomy()
  const [footerCount, setFooterCount] = createSignal(0)
  return {
    ...registration,
    registerFooter: () => {
      setFooterCount((count) => count + 1)
      return () => setFooterCount((count) => count - 1)
    },
    hasFooter: () => footerCount() > 0,
  }
}

export interface DialogContentContext extends ReturnType<typeof createDialogContentRegistration> {
  readonly variants: Required<DialogT.Variants>
  overlayScroll: () => boolean
}

export const [DialogContentProvider, useDialogContent] =
  /* @__PURE__ */ createContextProvider<DialogContentContext>('DialogContent')
