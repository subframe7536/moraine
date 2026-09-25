import { createContextProvider } from '../../shared/create-context-provider'

import type { CardT } from './card.types'

interface CardContext {
  readonly variant: CardT.Variant['variant']
  readonly size: CardT.Variant['size']
  readonly presentation: {
    readonly classes?: CardT.Classes
    readonly styles?: CardT.Styles
  }
}

export const [CardProvider, useCardContext] = createContextProvider<CardContext>('Card')
