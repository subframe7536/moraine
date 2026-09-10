import type { Accessor } from 'solid-js'
import { createContext, useContext } from 'solid-js'

import type { Cn } from '../style/cn'
import { cn } from '../style/cn'

export const MoraineCnContext = createContext<Accessor<Cn>>(() => cn)

/** Captures the nearest Provider; the stable handle follows config replacements while its owner lives. */
export function useCn(): Cn {
  const currentCn = useContext(MoraineCnContext)
  return (...classes) => currentCn()(...classes)
}
