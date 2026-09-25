import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentRegistration } from '../base/content-registration'

import type { SheetT } from './sheet.types'

export interface SheetPresentationContext {
  readonly presentation: { classes?: SheetT.Classes; styles?: SheetT.Styles }
}

export const [SheetPresentationProvider, useSheetPresentation] =
  createContextProvider<SheetPresentationContext>('SheetPresentation')

export interface SheetContentContext extends ReturnType<typeof createContentRegistration> {
  readonly variants: Required<SheetT.Variant>
  hasHeader: () => boolean
}

export const [SheetContentProvider, useSheetContent] =
  createContextProvider<SheetContentContext>('SheetContent')
