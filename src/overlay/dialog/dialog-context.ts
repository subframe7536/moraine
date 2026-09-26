import { createSignal } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { createContentAnatomy } from '../base/content-anatomy'
import { useModalContext } from '../modal/modal-context'

import type { DialogT } from './dialog.types'

export function useDialogConfig(): DialogT.Props {
  const configuration = useModalContext().configuration
  if (configuration.kind !== 'dialog') {
    throw new Error('Dialog parts must be used within <Dialog />')
  }
  return configuration.props
}

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
  readonly variants: Required<DialogT.Variant>
  overlayScroll: () => boolean
  hasHeader: () => boolean
}

export const [DialogContentProvider, useDialogContent] =
  createContextProvider<DialogContentContext>('DialogContent')
