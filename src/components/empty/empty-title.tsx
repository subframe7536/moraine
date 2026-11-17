import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

/**
 * Headline of an `Empty` state; place it inside `Empty`. It renders a `div` by default, so pass
 * `as="h2"` (or another heading) when the surrounding page needs a heading. No role or ARIA
 * relationship is added automatically.
 *
 * @example
 * ```tsx
 * import { Empty } from 'moraine'
 *
 * <Empty>
 *   <Empty.Title as="h2">No projects yet</Empty.Title>
 * </Empty>
 * ```
 */
export const EmptyTitle: <T extends ValidComponent = 'div'>(
  props: EmptyT.TitleProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('title', 'div')
