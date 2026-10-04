import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { EmptyProvider, useEmptyContext } from './empty-context'
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

function EmptyMedia<T extends ValidComponent = 'div'>(props: EmptyT.MediaProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useEmptyContext()
  const resolved = createStyles(emptyRecipe, local, {
    rootSlot: 'media',
    inheritedVariants: () => ({ size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="empty-media"
      {...rest}
      {...resolved.styles.media}
    >
      {local.children}
    </Dynamic>
  )
}

function EmptyTitle<T extends ValidComponent = 'div'>(props: EmptyT.TitleProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useEmptyContext()
  const resolved = createStyles(emptyRecipe, local, {
    rootSlot: 'title',
    inheritedVariants: () => ({ size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="empty-title"
      {...rest}
      {...resolved.styles.title}
    >
      {local.children}
    </Dynamic>
  )
}

function EmptyDescription<T extends ValidComponent = 'p'>(
  props: EmptyT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useEmptyContext()
  const resolved = createStyles(emptyRecipe, local, {
    rootSlot: 'description',
    inheritedVariants: () => ({ size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="empty-description"
      {...rest}
      {...resolved.styles.description}
    >
      {local.children}
    </Dynamic>
  )
}

function EmptyActions<T extends ValidComponent = 'div'>(
  props: EmptyT.ActionsProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useEmptyContext()
  const resolved = createStyles(emptyRecipe, local, {
    rootSlot: 'actions',
    inheritedVariants: () => ({ size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="empty-actions"
      {...rest}
      {...resolved.styles.actions}
    >
      {local.children}
    </Dynamic>
  )
}

Empty.Media = EmptyMedia
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription
Empty.Actions = EmptyActions
