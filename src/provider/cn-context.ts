import type { Accessor } from 'solid-js'

import { createContextProvider } from '../shared/create-context-provider.tsx'
import type { Cn } from '../theme/style/cn'
import { cn } from '../theme/style/cn'

export const [MoraineCnProvider, useCnAccessor] = createContextProvider<Accessor<Cn>>(
  'MoraineCn',
  () => cn,
)

/** Captures the nearest Provider; the stable handle follows config replacements while its owner lives. */
export function useCn(): Cn {
  const currentCn = useCnAccessor()
  return (...classes) => currentCn()(...classes)
}
