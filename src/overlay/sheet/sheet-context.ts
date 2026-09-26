import { createContextProvider } from '../../shared/create-context-provider'
import type { createContentRegistration } from '../base/content-registration'
import { useModalContext } from '../modal/modal-context'

import type { SheetT } from './sheet.types'

export function useSheetConfig(): SheetT.Props {
  const configuration = useModalContext().configuration
  if (configuration.kind !== 'sheet') {
    throw new Error('Sheet parts must be used within <Sheet />')
  }
  return configuration.props
}

export interface SheetContentContext extends ReturnType<typeof createContentRegistration> {
  readonly variants: Required<SheetT.Variant>
  hasHeader: () => boolean
}

export const [SheetContentProvider, useSheetContent] =
  createContextProvider<SheetContentContext>('SheetContent')
