import type { JSX } from 'solid-js'
import { splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { CardProvider, useCardContext } from './card-context'
import { cardRecipe } from './card.recipe'
import type { CardStyleSlot } from './card.style-types'
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

type CardPartSlot = Exclude<keyof CardStyleSlot, 'root'>

type CardPartProps = Omit<JSX.HTMLAttributes<HTMLElement>, 'style' | 'class' | 'children'> & {
  slot: CardPartSlot
  fallback: ValidComponent
  as?: ValidComponent
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

function CardPart(props: CardPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ['slot', 'fallback', 'as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: untrack(() => local.slot),
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })

  return (
    <Dynamic
      component={local.as ?? local.fallback}
      data-slot={`card-${local.slot}`}
      {...rest}
      {...resolved.styles[local.slot]}
    >
      {local.children}
    </Dynamic>
  )
}

function CardHeader<T extends ValidComponent = 'div'>(props: CardT.HeaderProps<T>): JSX.Element {
  return <CardPart slot="header" fallback="div" {...props} />
}

function CardTitle<T extends ValidComponent = 'div'>(props: CardT.TitleProps<T>): JSX.Element {
  return <CardPart slot="title" fallback="div" {...props} />
}

function CardDescription<T extends ValidComponent = 'p'>(
  props: CardT.DescriptionProps<T>,
): JSX.Element {
  return <CardPart slot="description" fallback="p" {...props} />
}

function CardAction<T extends ValidComponent = 'div'>(props: CardT.ActionProps<T>): JSX.Element {
  return <CardPart slot="action" fallback="div" {...props} />
}

function CardBody<T extends ValidComponent = 'div'>(props: CardT.BodyProps<T>): JSX.Element {
  return <CardPart slot="body" fallback="div" {...props} />
}

function CardFooter<T extends ValidComponent = 'div'>(props: CardT.FooterProps<T>): JSX.Element {
  return <CardPart slot="footer" fallback="div" {...props} />
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Action = CardAction
Card.Body = CardBody
Card.Footer = CardFooter
