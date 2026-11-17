import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'

/**
 * Title of a `Card`, normally placed inside `Card.Header`. It renders a `div` by default; pass
 * `as` (for example `as="h3"`) when the page needs a real heading element.
 *
 * @example
 * ```tsx
 * import { Card } from 'moraine'
 *
 * <Card>
 *   <Card.Header>
 *     <Card.Title as="h3">Project</Card.Title>
 *   </Card.Header>
 * </Card>
 * ```
 */
export const CardTitle: <T extends ValidComponent = 'div'>(
  props: CardT.TitleProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('title', 'div')
