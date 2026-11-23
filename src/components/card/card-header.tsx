import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'
/**
 * Header region at the top of a `Card` that groups `Card.Title`, `Card.Description`, and
 * `Card.Action`. Place it as a direct child of `Card`; it renders a `div` by default and accepts
 * `as`.
 *
 * @example
 * ```tsx
 * import { Card } from 'moraine'
 *
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Project</Card.Title>
 *     <Card.Description>Summary of your project.</Card.Description>
 *   </Card.Header>
 * </Card>
 * ```
 */
export const CardHeader: <T extends ValidComponent = 'div'>(
  props: CardT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('header', 'div')
