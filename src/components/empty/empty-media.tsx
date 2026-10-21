import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export const EmptyMedia: <T extends ValidComponent = 'div'>(
  props: EmptyT.MediaProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('media', 'div')
