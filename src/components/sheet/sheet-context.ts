import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentAnatomy } from '../shared/overlay/content-anatomy'

import type { SheetT } from './sheet.types'
export interface SheetContextValue {
  readonly slotOverrides: { classes?: SheetT.Classes; styles?: SheetT.Styles }
  side?: SheetT.Variants['side'] | null
  inset?: boolean | null
  overlay?: boolean
  closable?: boolean
  closeIcon?: SheetT.Base['closeIcon']
  translations?: SheetT.Translations
  readonly content?: SheetContentContext
}

export const [SheetProvider, useSheetContext] =
  /* @__PURE__ */ createContextProvider<SheetContextValue>('Sheet')

export interface SheetContentContext extends ReturnType<typeof createContentAnatomy> {
  readonly variants: Required<SheetT.Variants>
}

export function useSheetContent(): SheetContentContext {
  const content = useSheetContext().content
  if (!content) {
    throw new TypeError('useSheetContent must be used within <Sheet.Content />')
  }
  return content
}
