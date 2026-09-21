import { createContextProvider } from '../../shared/create-context-provider'

import type { SheetT } from './sheet.types'

export interface SheetPresentationContext {
  readonly presentation: { classes?: SheetT.Classes; styles?: SheetT.Styles }
}

export const [SheetPresentationProvider, useSheetPresentation] =
  createContextProvider<SheetPresentationContext>('SheetPresentation')
