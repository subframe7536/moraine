import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentAnatomy } from '../base/content-anatomy'

import type { SheetT } from './sheet.types'

export interface SheetContextValue {
  readonly slotOverrides: { classes?: SheetT.Classes; styles?: SheetT.Styles }
  side?: SheetT.Variants['side'] | null
  inset?: boolean | null
  overlay?: boolean
  transition?: boolean
  close?: boolean
  closeIcon?: SheetT.Base['closeIcon']
}

export const [SheetProvider, useSheetContext] =
  /* @__PURE__ */ createContextProvider<SheetContextValue>('Sheet')

export interface SheetContentContext extends ReturnType<typeof createContentAnatomy> {
  readonly variants: Required<SheetT.Variants>
}

export const [SheetContentProvider, useSheetContent] =
  /* @__PURE__ */ createContextProvider<SheetContentContext>('SheetContent')
