import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, mergeProps, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useSidebarFrameContext, useSidebarFrameStyles } from './sidebar-frame-context'
import { sidebarFrameDataAttributes } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Interactive navigation item within a sidebar menu. */
export function SidebarFrameItem<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.ItemProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'disabled',
    'isActive',
    'leading',
    'ref' as any,
    'style',
    'trailing',
    'href',
  ])

  const resolved = useSidebarFrameStyles('item', local)

  const resolvedTag = createMemo<ValidComponent>(() => {
    if (local.as) {
      return local.as
    }
    const href = local.href
    return href !== undefined && href !== null ? 'a' : 'button'
  })

  const disabled = () => Boolean(local.disabled)

  const root = createPolymorphicRoot({
    tag: resolvedTag,
    ref: () => local.ref,
  })

  const interactionRest = mergeProps(rest, {
    get href() {
      return local.href
    },
  })

  const interactionProps = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      element: root.element,
      tag: resolvedTag,
    },
    interactionRest,
  )

  const elementProps = mergeProps(interactionProps, {
    get href() {
      // `null` (not `undefined`) so Solid mergeProps overwrites the interaction href.
      return resolvedTag() === 'a' && disabled() ? null : local.href
    },
    get 'aria-current'() {
      if ((resolvedTag() === 'a' || local.href !== undefined) && local.isActive) {
        return (rest as any)['aria-current'] ?? 'page'
      }
      return (rest as any)['aria-current']
    },
  })

  const binding = root.bind(elementProps)

  const children = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = children()
    return value === 0 || Boolean(value)
  })

  return (
    <Dynamic
      component={resolvedTag()}
      data-slot="sidebar-frame-item"
      {...binding}
      {...resolved.styles.item}
      {...sidebarFrameDataAttributes.item({
        active: () => Boolean(local.isActive),
        disabled,
        mobile: context.isMobile,
      })}
    >
      <Show when={local.leading}>
        {(iconName) => (
          <Icon
            name={iconName()}
            slotName="sidebar-frame-item-leading"
            class={resolved.styles.itemLeading.class}
            style={resolved.styles.itemLeading.style}
            aria-hidden={true}
          />
        )}
      </Show>
      <Show when={hasChildren()}>
        <span data-slot="sidebar-frame-item-label" {...resolved.styles.itemLabel}>
          {children()}
        </span>
      </Show>
      <Show when={local.trailing}>
        {(iconName) => (
          <Icon
            name={iconName()}
            slotName="sidebar-frame-item-trailing"
            class={resolved.styles.itemTrailing.class}
            style={resolved.styles.itemTrailing.style}
            aria-hidden={true}
          />
        )}
      </Show>
    </Dynamic>
  )
}
