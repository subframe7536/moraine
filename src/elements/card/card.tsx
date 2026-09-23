import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { cardDataAttributes, cardRecipe } from './card.recipe'
import type { CardProps } from './card.types'

/** Structured content container with optional header, body, footer, and action slots. */
export function Card(props: CardProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'header',
    'title',
    'description',
    'action',
    'footer',
    'compact',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(cardRecipe, local)

  const header = createMemo(() => local.header)
  const title = createMemo(() => local.title)
  const description = createMemo(() => local.description)
  const action = createMemo(() => local.action)
  const footer = createMemo(() => local.footer)
  const resolvedChildren = resolveChildren(() => local.children)

  return (
    <div data-slot="card" {...rest} {...resolved.styles.root}>
      <Show when={header() || title() || description()}>
        <div
          data-slot="card-header"
          {...cardDataAttributes.header({ action: () => Boolean(action()) })}
          {...resolved.styles.header}
        >
          <Show when={title() || description()} fallback={header()}>
            <Show when={title()}>
              <div data-slot="card-title" {...resolved.styles.title}>
                {title()}
              </div>
            </Show>
            <Show when={description()}>
              <p data-slot="card-description" {...resolved.styles.description}>
                {description()}
              </p>
            </Show>
            <Show when={action()}>
              <div data-slot="card-action" {...resolved.styles.action}>
                {action()}
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={resolvedChildren()}>
        {(body) => (
          <div
            data-slot="card-body"
            {...cardDataAttributes.body({ noFooter: () => !footer() })}
            {...resolved.styles.body}
          >
            {body()}
          </div>
        )}
      </Show>

      <Show when={footer()}>
        <div data-slot="card-footer" {...resolved.styles.footer}>
          {footer()}
        </div>
      </Show>
    </div>
  )
}
