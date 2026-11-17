import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

/**
 * Supporting text that explains an `Empty` state, grouped with `Empty.Title`; place it inside
 * `Empty`. It renders a `p` by default and can be changed with `as`.
 *
 * @example
 * ```tsx
 * import { Empty } from 'moraine'
 *
 * <Empty>
 *   <Empty.Title>No projects yet</Empty.Title>
 *   <Empty.Description>Create a project to organize your work.</Empty.Description>
 * </Empty>
 * ```
 */
export const EmptyDescription: <T extends ValidComponent = 'p'>(
  props: EmptyT.DescriptionProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('description', 'p')
