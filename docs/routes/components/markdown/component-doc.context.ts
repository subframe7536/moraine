import { createContext } from 'solid-js'

import type { ComponentApi } from '../../../build/api-doc/types'

export interface ComponentDocContextValue {
  name: string
  api?: ComponentApi
}

export const ComponentDocContext = createContext<ComponentDocContextValue>()
