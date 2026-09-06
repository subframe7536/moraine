import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'

import type { CardProps } from './card.types.ts'

export * from './card.types.ts'

/** Structured content container with optional header, body, footer, and action slots. */
export function Card(props: CardProps): JSX.Element {
  const design = useMoraineDesign()
  const cardDesign = () => design().card

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
  const compact = () => local.compact ?? cardDesign()?.defaultVariants?.compact ?? false

  const header = createMemo(() => local.header)
  const title = createMemo(() => local.title)
  const description = createMemo(() => local.description)
  const action = createMemo(() => local.action)
  const footer = createMemo(() => local.footer)
  const resolvedChildren = resolveChildren(() => local.children)

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return cardDesign()?.recipe({ compact: compact() })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  return (
    <div data-slot="root" {...rest} {...resolved.rootClassAndStyle()}>
      <Show when={header() || title() || description()}>
        <div
          data-slot="header"
          data-action={action() ? '' : undefined}
          {...resolved.slotClassAndStyle('header')}
        >
          <Show when={title() || description()} fallback={header()}>
            <Show when={title()}>
              <div data-slot="title" {...resolved.slotClassAndStyle('title')}>
                {title()}
              </div>
            </Show>
            <Show when={description()}>
              <p data-slot="description" {...resolved.slotClassAndStyle('description')}>
                {description()}
              </p>
            </Show>
            <Show when={action()}>
              <div data-slot="action" {...resolved.slotClassAndStyle('action')}>
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
            {...resolved.slotClassAndStyle('body')}
          >
            {body()}
          </div>
        )}
      </Show>

      <Show when={footer()}>
        <div data-slot="footer" {...resolved.slotClassAndStyle('footer')}>
          {footer()}
        </div>
      </Show>
    </div>
  )
}
