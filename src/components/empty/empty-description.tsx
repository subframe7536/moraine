import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export const EmptyDescription: <T extends ValidComponent = 'p'>(
  props: EmptyT.DescriptionProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('description', 'p')
