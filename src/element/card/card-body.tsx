import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { CardPart } from './card-part'
import type { CardT } from './card.types'

export function CardBody<T extends ValidComponent = 'div'>(props: CardT.BodyProps<T>): JSX.Element {
  return <CardPart slot="body" fallback="div" {...props} />
}
