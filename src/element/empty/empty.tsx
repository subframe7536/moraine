import type { JSX } from 'solid-js'
import { splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { EmptyProvider, useEmptyContext } from './empty-context'
import { emptyRecipe } from './empty.recipe'
import type { EmptyStyleSlot } from './empty.style-types'
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

type EmptyPartSlot = Exclude<keyof EmptyStyleSlot, 'root'>

type EmptyPartProps = Omit<JSX.HTMLAttributes<HTMLElement>, 'style' | 'class' | 'children'> & {
  slot: EmptyPartSlot
  fallback: ValidComponent
  as?: ValidComponent
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

function EmptyPart(props: EmptyPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ['slot', 'fallback', 'as', 'class', 'style', 'children'])
  const context = useEmptyContext()
  const resolved = createStyles(emptyRecipe, local, {
    rootSlot: untrack(() => local.slot),
    inheritedVariants: () => ({ size: context.size }),
    inheritedStyles: () => context.presentation,
  })

  return (
    <Dynamic
      component={local.as ?? local.fallback}
      data-slot={`empty-${local.slot}`}
      {...rest}
      {...resolved.styles[local.slot]}
    >
      {local.children}
    </Dynamic>
  )
}

function EmptyMedia<T extends ValidComponent = 'div'>(props: EmptyT.MediaProps<T>): JSX.Element {
  return <EmptyPart slot="media" fallback="div" {...props} />
}

function EmptyTitle<T extends ValidComponent = 'div'>(props: EmptyT.TitleProps<T>): JSX.Element {
  return <EmptyPart slot="title" fallback="div" {...props} />
}

function EmptyDescription<T extends ValidComponent = 'p'>(
  props: EmptyT.DescriptionProps<T>,
): JSX.Element {
  return <EmptyPart slot="description" fallback="p" {...props} />
}

function EmptyActions<T extends ValidComponent = 'div'>(
  props: EmptyT.ActionsProps<T>,
): JSX.Element {
  return <EmptyPart slot="actions" fallback="div" {...props} />
}

Empty.Media = EmptyMedia
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription
Empty.Actions = EmptyActions
