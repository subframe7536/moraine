import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { CardPart } from './card-part'
import type { CardT } from './card.types'

export function CardFooter<T extends ValidComponent = 'div'>(
  props: CardT.FooterProps<T>,
): JSX.Element {
  return <CardPart slot="footer" fallback="div" {...props} />
}
