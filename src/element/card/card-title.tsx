import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'

export const CardTitle: <T extends ValidComponent = 'div'>(
  props: CardT.TitleProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('title', 'div')
