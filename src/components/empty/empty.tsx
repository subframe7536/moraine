import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { EmptyActions } from './empty-actions'
import { EmptyProvider } from './empty-context'
import { EmptyDescription } from './empty-description'
import { EmptyMedia } from './empty-media'
import { EmptyTitle } from './empty-title'
import { emptyRecipe } from './empty.recipe'
import type { EmptyT } from './empty.types'
/**
 * Empty-state presentation that composes `Empty.Media`, `Empty.Title`, `Empty.Description`, and
 * `Empty.Actions` and shares its `size` with them. Use it when a collection or search result is
 * genuinely empty and the next action should be visible; it does not inspect data, so the page
 * decides when to render it. Use `Skeleton` while content is still loading.
 *
 * @example
 * ```tsx
 * import { Button, Empty, Icon } from 'moraine'
 *
 * <Empty>
 *   <Empty.Media>
 *     <Icon name="i-lucide-inbox" />
 *   </Empty.Media>
 *   <Empty.Title>Your inbox is empty</Empty.Title>
 *   <Empty.Description>Start a conversation with your team.</Empty.Description>
 *   <Empty.Actions>
 *     <Button>New message</Button>
 *   </Empty.Actions>
 * </Empty>
 * ```
 */
export function Empty<T extends ValidComponent = 'div'>(props: EmptyT.Props<T>): JSX.Element {
  const local = pick(props, 'as', 'size', 'classes', 'styles', 'class', 'style')
  const rest = omit(props, 'as', 'size', 'classes', 'styles', 'class', 'style')
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(emptyRecipe, local)

  return (
    <EmptyProvider
      value={{
        get size() {
          return variants.size
        },
        get slotOverrides() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <Dynamic component={local.as ?? 'div'} data-slot="empty" {...rootSlot} {...(rest as any)} />
    </EmptyProvider>
  )
}

Empty.Media = EmptyMedia
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription
Empty.Actions = EmptyActions
