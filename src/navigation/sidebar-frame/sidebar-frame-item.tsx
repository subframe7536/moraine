import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, mergeProps, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Collapsible } from '../../element/collapsible'
import { useOptionalCollapsibleContext } from '../../element/collapsible/collapsible-context'
import { Icon } from '../../element/icon'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'

import { useSidebarFrameContext, useSidebarFrameStyles } from './sidebar-frame-context'
import {
  SIDEBAR_FRAME_ITEM_CONTAINER_CLASS,
  sidebarFrameDataAttributes,
} from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

function shouldCloseOnSelect(
  event: MouseEvent,
  options: {
    closeOnSelect?: boolean
    disabled: boolean
    href?: string
    isMobile: boolean
  },
): boolean {
  if (!options.isMobile || options.disabled || event.defaultPrevented) {
    return false
  }
  if (
    (event.button !== undefined && event.button !== 0) ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false
  }
  return options.closeOnSelect ?? Boolean(options.href)
}

/** Interactive navigation item within a sidebar menu. */
export function SidebarFrameItem<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.ItemProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const collapsible = useOptionalCollapsibleContext()
  const [local, rest] = splitProps(props as SidebarFrameT.ItemProps<T> & { ref?: unknown }, [
    'actions',
    'as',
    'children',
    'class',
    'closeOnSelect',
    'disabled',
    'href',
    'isActive',
    'leading',
    'ref',
    'style',
    'trailing',
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
    onClick: (event: MouseEvent) => {
      const result = callHandler(
        event,
        (rest as { onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent> }).onClick,
      )
      if (
        shouldCloseOnSelect(event, {
          closeOnSelect: local.closeOnSelect,
          disabled: disabled(),
          href: local.href,
          isMobile: context.isMobile(),
        }) &&
        !result.defaultPrevented
      ) {
        context.setOpen(false)
      }
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
      return resolvedTag() === 'a' && disabled() ? null : local.href
    },
    get title() {
      return (rest as { title?: string }).title
    },
    get 'aria-current'() {
      if ((resolvedTag() === 'a' || local.href !== undefined) && local.isActive) {
        return (rest as { 'aria-current'?: string })['aria-current'] ?? 'page'
      }
      return (rest as { 'aria-current'?: string })['aria-current']
    },
  })

  const binding = root.bind(elementProps)
  const children = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = children()
    return value === 0 || Boolean(value)
  })
  const actions = createMemo(() => local.actions)
  const hasActions = createMemo(() => {
    const value = actions()
    return value !== undefined && value !== null && value !== false
  })

  const itemData = (withActions = false) =>
    sidebarFrameDataAttributes.item({
      active: () => Boolean(local.isActive),
      disabled,
      mobile: context.isMobile,
      withActions,
    })

  const ItemTrigger = (triggerProps: { withActions?: boolean }) => (
    <Dynamic
      component={resolvedTag()}
      data-slot={triggerProps.withActions ? 'sidebar-frame-item-trigger' : 'sidebar-frame-item'}
      {...itemData(Boolean(triggerProps.withActions))}
      {...binding}
      {...resolved.styles.item}
    >
      <Show when={local.leading}>
        {(iconName) => (
          <Icon
            name={iconName()}
            slotName="sidebar-frame-item-leading"
            {...resolved.styles.itemLeading}
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
            {...resolved.styles.itemTrailing}
            aria-hidden={true}
            {...sidebarFrameDataAttributes.itemTrailing({
              expanded: () => local.as === Collapsible.Trigger && collapsible?.disclosure.open(),
            })}
          />
        )}
      </Show>
    </Dynamic>
  )

  return (
    <Show when={hasActions()} fallback={<ItemTrigger />}>
      <div
        data-slot="sidebar-frame-item"
        class={SIDEBAR_FRAME_ITEM_CONTAINER_CLASS}
        {...itemData()}
      >
        <ItemTrigger withActions />
        <div data-slot="sidebar-frame-item-actions" {...resolved.styles.itemActions}>
          {actions()}
        </div>
      </div>
    </Show>
  )
}
