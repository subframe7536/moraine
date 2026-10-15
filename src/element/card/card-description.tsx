import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createCardPart } from './card-part'
import type { CardT } from './card.types'

export const CardDescription: <T extends ValidComponent = 'p'>(
  props: CardT.DescriptionProps<T>,
) => JSX.Element = /* @__PURE__ */ createCardPart('description', 'p')
