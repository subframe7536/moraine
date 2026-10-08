import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { EmptyActions } from './empty-actions'
import { EmptyProvider } from './empty-context'
import { EmptyDescription } from './empty-description'
import { EmptyMedia } from './empty-media'
import { EmptyTitle } from './empty-title'
import { emptyRecipe } from './empty.recipe'
import type { EmptyT } from './empty.types'

/** Empty-state presentation and shared styling for its parts. */
export function Empty<T extends ValidComponent = 'div'>(props: EmptyT.Props<T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'children',
  ])
  const resolved = createStyles(emptyRecipe, local)

  return (
    <EmptyProvider
      value={{
        get size() {
          return resolved.variants.size
        },
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <Dynamic component={local.as ?? 'div'} data-slot="empty" {...rest} {...resolved.styles.root}>
        {local.children}
      </Dynamic>
    </EmptyProvider>
  )
}

Empty.Media = EmptyMedia
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription
Empty.Actions = EmptyActions
