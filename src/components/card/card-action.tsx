import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'
/**
 * Slot inside `Card.Header` for a control related to the whole card, such as a button or menu
 * trigger. It renders a `div` by default and accepts `as`.
 *
 * @example
 * ```tsx
 * import { Button, Card } from 'moraine'
 *
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Project</Card.Title>
 *     <Card.Action>
 *       <Button size="sm">Edit</Button>
 *     </Card.Action>
 *   </Card.Header>
 * </Card>
 * ```
 */
export const CardAction: <T extends ValidComponent = 'div'>(
  props: CardT.ActionProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('action', 'div')
