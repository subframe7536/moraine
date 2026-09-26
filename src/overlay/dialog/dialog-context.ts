import { createSignal } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { createContentRegistration } from '../base/content-registration'

import type { DialogT } from './dialog.types'

export const [DialogConfigProvider, useDialogConfig] =
  createContextProvider<DialogT.Props>('DialogConfig')

export function createDialogContentRegistration() {
  const registration = createContentRegistration()
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
  readonly variants: Required<DialogT.Variant>
  overlayScroll: () => boolean
  hasHeader: () => boolean
}

export const [DialogContentProvider, useDialogContent] =
  createContextProvider<DialogContentContext>('DialogContent')
