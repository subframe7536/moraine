import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { Icon } from '../icon/index.ts'

import type { BadgeProps } from './badge.types.ts'

export * from './badge.types.ts'

/** Compact label component with leading/trailing icon slots and variant styles. */
export function Badge(props: BadgeProps): JSX.Element {
  const design = useMoraineDesign()
  const badgeDesign = () => design().badge

  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'leading',
    'trailing',
    'children',
  ])
  const size = () => local.size ?? badgeDesign()?.defaultVariants?.size ?? 'md'
  const variant = () => local.variant ?? badgeDesign()?.defaultVariants?.variant ?? 'default'

  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const resolvedChildren = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return badgeDesign()?.recipe({ size: size(), variant: variant() })
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
    <span
      data-slot="root"
      data-size={size()}
      data-variant={variant()}
      {...rest}
      {...resolved.rootClassAndStyle()}
    >
      <Show when={leading()}>
        {(leading) => (
          <Icon name={leading()} slotName="leading" {...resolved.slotClassAndStyle('leading')} />
        )}
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="label" {...resolved.slotClassAndStyle('label')}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={trailing()}>
        <Icon name={trailing()} slotName="trailing" {...resolved.slotClassAndStyle('trailing')} />
      </Show>
    </span>
  )
}
