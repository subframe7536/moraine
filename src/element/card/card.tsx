import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { CardProvider, useCardContext } from './card-context'
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

function CardHeader<T extends ValidComponent = 'div'>(props: CardT.HeaderProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: 'header',
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="card-header"
      {...rest}
      {...resolved.styles.header}
    >
      {local.children}
    </Dynamic>
  )
}

function CardTitle<T extends ValidComponent = 'div'>(props: CardT.TitleProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: 'title',
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="card-title"
      {...rest}
      {...resolved.styles.title}
    >
      {local.children}
    </Dynamic>
  )
}

function CardDescription<T extends ValidComponent = 'p'>(
  props: CardT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: 'description',
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="card-description"
      {...rest}
      {...resolved.styles.description}
    >
      {local.children}
    </Dynamic>
  )
}

function CardAction<T extends ValidComponent = 'div'>(props: CardT.ActionProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: 'action',
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="card-action"
      {...rest}
      {...resolved.styles.action}
    >
      {local.children}
    </Dynamic>
  )
}

function CardBody<T extends ValidComponent = 'div'>(props: CardT.BodyProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: 'body',
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="card-body"
      {...rest}
      {...resolved.styles.body}
    >
      {local.children}
    </Dynamic>
  )
}

function CardFooter<T extends ValidComponent = 'div'>(props: CardT.FooterProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const context = useCardContext()
  const resolved = createStyles(cardRecipe, local, {
    rootSlot: 'footer',
    inheritedVariants: () => ({ variant: context.variant, size: context.size }),
    inheritedStyles: () => context.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="card-footer"
      {...rest}
      {...resolved.styles.footer}
    >
      {local.children}
    </Dynamic>
  )
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Action = CardAction
Card.Body = CardBody
Card.Footer = CardFooter
