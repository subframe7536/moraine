import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentRegistration } from '../base/content-registration'

import type { DialogT } from './dialog.types'

export interface DialogPresentationContext {
  readonly presentation: { classes?: DialogT.Classes; styles?: DialogT.Styles }
}

export const [DialogPresentationProvider, useDialogPresentation] =
  createContextProvider<DialogPresentationContext>('DialogPresentation')

export interface DialogContentContext extends ReturnType<typeof createContentRegistration> {
  readonly variants: Required<DialogT.Variant>
  overlayScroll: () => boolean
  hasHeader: () => boolean
}

export const [DialogContentProvider, useDialogContent] =
  createContextProvider<DialogContentContext>('DialogContent')
