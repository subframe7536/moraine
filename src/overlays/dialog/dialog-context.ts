import { createContextProvider } from '../../shared/create-context-provider'

import type { DialogT } from './dialog.types'

export interface DialogPresentationContext {
  readonly presentation: { classes?: DialogT.Classes; styles?: DialogT.Styles }
}

export const [DialogPresentationProvider, useDialogPresentation] =
  createContextProvider<DialogPresentationContext>('DialogPresentation')
