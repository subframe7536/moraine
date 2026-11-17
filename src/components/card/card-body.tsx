import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'

/**
 * Main content region of a `Card`, placed as a direct child of `Card` between the header and
 * footer. It renders a `div` by default and accepts `as`.
 *
 * @example
 * ```tsx
 * import { Card } from 'moraine'
 *
 * <Card>
 *   <Card.Body>Project details</Card.Body>
 * </Card>
 * ```
 */
export const CardBody: <T extends ValidComponent = 'div'>(
  props: CardT.BodyProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('body', 'div')
