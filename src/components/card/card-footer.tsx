import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'
/**
 * Footer region at the bottom of a `Card` for secondary content or actions, placed as a direct
 * child of `Card`. It renders a `div` by default and accepts `as`; the `Card` `variant` controls
 * its border and background.
 *
 * @example
 * ```tsx
 * import { Card } from 'moraine'
 *
 * <Card>
 *   <Card.Body>Project details</Card.Body>
 *   <Card.Footer>Updated today</Card.Footer>
 * </Card>
 * ```
 */
export const CardFooter: <T extends ValidComponent = 'div'>(
  props: CardT.FooterProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('footer', 'div')
