import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { CardAction } from './card-action'
import { CardBody } from './card-body'
import { CardProvider } from './card-context'
import { CardDescription } from './card-description'
import { CardFooter } from './card-footer'
import { CardHeader } from './card-header'
import { CardTitle } from './card-title'
import { cardRecipe } from './card.recipe'
import type { CardT } from './card.types'

/** Static surface and shared presentation for its parts. */
export function Card<T extends ValidComponent = 'div'>(props: CardT.Props<T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'children',
  ])
  const resolved = createStyles(cardRecipe, local)

  return (
    <CardProvider
      value={{
        get variant() {
          return resolved.variants.variant
        },
        get size() {
          return resolved.variants.size
        },
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <Dynamic component={local.as ?? 'div'} data-slot="card" {...rest} {...resolved.styles.root}>
        {local.children}
      </Dynamic>
    </CardProvider>
  )
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Action = CardAction
Card.Body = CardBody
Card.Footer = CardFooter
