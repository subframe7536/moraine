import { createContextProvider } from '../../../shared/create-context-provider.tsx'
import type { BaseSelectValue } from '../../base-select/base-select.types.ts'

export interface SelectCanonicalContext {
  hasValue: (value: BaseSelectValue) => boolean
}

export const [SelectCanonicalProvider, useSelectCanonical] =
  createContextProvider<SelectCanonicalContext | null>('SelectCanonical', null)
