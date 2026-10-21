import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export const EmptyActions: <T extends ValidComponent = 'div'>(
  props: EmptyT.ActionsProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('actions', 'div')
