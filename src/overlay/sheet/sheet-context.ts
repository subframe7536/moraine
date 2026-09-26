import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentRegistration } from '../base/content-registration'

import type { SheetT } from './sheet.types'

export interface SheetContentContext extends ReturnType<typeof createContentRegistration> {
  readonly variants: Required<SheetT.Variant>
  hasHeader: () => boolean
}

export const [SheetContentProvider, useSheetContent] =
  createContextProvider<SheetContentContext>('SheetContent')
