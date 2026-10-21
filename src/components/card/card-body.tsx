import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'

export const CardBody: <T extends ValidComponent = 'div'>(
  props: CardT.BodyProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('body', 'div')
