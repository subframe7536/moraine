import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

/**
 * Container for the next useful commands of an `Empty` state, usually `Button`s wired to
 * application handlers; place it inside `Empty`. It renders a `div` by default.
 *
 * @example
 * ```tsx
 * import { Button, Empty } from 'moraine'
 *
 * <Empty>
 *   <Empty.Title>Your inbox is empty</Empty.Title>
 *   <Empty.Actions>
 *     <Button>New message</Button>
 *   </Empty.Actions>
 * </Empty>
 * ```
 */
export const EmptyActions: <T extends ValidComponent = 'div'>(
  props: EmptyT.ActionsProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('actions', 'div')
