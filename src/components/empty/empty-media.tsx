import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createEmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'
/**
 * Leading visual of an `Empty` state, such as an `Icon`, `Avatar`, `AvatarGroup`, or image; place
 * it inside `Empty`. It accepts arbitrary JSX, imposes no fixed media size, and renders a `div` by
 * default.
 *
 * @example
 * ```tsx
 * import { Empty, Icon } from 'moraine'
 *
 * <Empty>
 *   <Empty.Media>
 *     <Icon name="i-lucide-folder-open" />
 *   </Empty.Media>
 *   <Empty.Title>No projects yet</Empty.Title>
 * </Empty>
 * ```
 */
export const EmptyMedia: <T extends ValidComponent = 'div'>(
  props: EmptyT.MediaProps<T>,
) => JSX.Element = /* @__PURE__ */ createEmptyPart('media', 'div')
