import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'
/**
 * Supporting text for a `Card`, normally placed inside `Card.Header` after `Card.Title`. It renders
 * a `p` by default and accepts `as`.
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
export const CardDescription: <T extends ValidComponent = 'p'>(
  props: CardT.DescriptionProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('description', 'p')
