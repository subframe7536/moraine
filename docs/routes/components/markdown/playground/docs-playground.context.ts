import { createContext } from 'solid-js'

import type { ComponentApi } from '../../../../build/api-doc/types'

export const DocsPlaygroundApiContext = createContext<ComponentApi | undefined>()
