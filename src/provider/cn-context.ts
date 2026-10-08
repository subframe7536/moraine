import type { Cn } from '../theme/cn'

import { useMoraineContext } from './moraine-context'

/** Captures the nearest Provider; the stable handle follows config replacements while its owner lives. */
export function useCn(): Cn {
  const context = useMoraineContext()
  return (...classes) => context.cn(...classes)
}
