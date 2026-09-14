import { createContext } from 'solid-js'

import type { BaseSelectT } from '../base-select.types.ts'

export const FormValueExistsContext = createContext<(value: BaseSelectT.Value) => boolean>()
