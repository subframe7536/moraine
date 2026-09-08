import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'

import type { CardProps } from './card.types.ts'

export * from './card.types.ts'

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
  const resolved = createComponentStyles('card', local)

  const header = createMemo(() => local.header)
  const title = createMemo(() => local.title)
  const description = createMemo(() => local.description)
  const action = createMemo(() => local.action)
  const footer = createMemo(() => local.footer)
  const resolvedChildren = resolveChildren(() => local.children)

  return (
    <div data-slot="root" {...rest} {...resolved.root}>
      <Show when={header() || title() || description()}>
        <div
          data-slot="header"
          data-action={action() ? '' : undefined}
          {...resolved.slot('header')}
        >
          <Show when={title() || description()} fallback={header()}>
            <Show when={title()}>
              <div data-slot="title" {...resolved.slot('title')}>
                {title()}
              </div>
            </Show>
            <Show when={description()}>
              <p data-slot="description" {...resolved.slot('description')}>
                {description()}
              </p>
            </Show>
            <Show when={action()}>
              <div data-slot="action" {...resolved.slot('action')}>
                {action()}
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={resolvedChildren()}>
        {(body) => (
          <div
            data-slot="body"
            data-no-footer={!footer() ? '' : undefined}
            {...resolved.slot('body')}
          >
            {body()}
          </div>
        )}
      </Show>

      <Show when={footer()}>
        <div data-slot="footer" {...resolved.slot('footer')}>
          {footer()}
        </div>
      </Show>
    </div>
  )
}
