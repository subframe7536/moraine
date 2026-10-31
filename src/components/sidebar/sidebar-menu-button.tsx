import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, mergeProps, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { hasContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'
import { Icon } from '../icon'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

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

/** Interactive button or link of a sidebar menu item. */
export function SidebarMenuButton<T extends ValidComponent = 'button'>(
  props: SidebarT.MenuButtonProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props as SidebarT.MenuButtonProps<T> & { ref?: unknown }, [
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

  const {
    slots: {
      menuButtonLeading: menuButtonLeadingSlot,
      menuButtonLabel: menuButtonLabelSlot,
      menuButtonTrailing: menuButtonTrailingSlot,
    },
    slotWith,
  } = useSidebarStyles('menuButton', local)

  const resolvedTag = createMemo<ValidComponent>(() => {
    if (local.as) {
      return local.as
    }
    const href = local.href
    return href !== undefined && href !== null ? 'a' : 'button'
  })

  const disabled = () => Boolean(local.disabled)
  const menuButtonSlot = slotWith('menuButton', {
    data: sidebarDataAttributes.menuButton({
      active: () => Boolean(local.isActive),
      disabled,
      mobile: context.isMobile,
    }),
  })

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
  const hasChildren = () => hasContent(children())
  return (
    <Dynamic
      component={resolvedTag()}
      data-slot="sidebar-menu-button"
      {...menuButtonSlot}
      {...binding}
    >
      <Show when={local.leading}>
        {(iconName) => (
          <Icon
            name={iconName()}
            data-slot="sidebar-menu-button-leading"
            {...menuButtonLeadingSlot}
            aria-hidden={true}
          />
        )}
      </Show>
      <Show when={hasChildren()}>
        <span data-slot="sidebar-menu-button-label" {...menuButtonLabelSlot}>
          {children()}
        </span>
      </Show>
      <Show when={local.trailing}>
        {(iconName) => (
          <Icon
            name={iconName()}
            data-slot="sidebar-menu-button-trailing"
            {...menuButtonTrailingSlot}
            aria-hidden={true}
          />
        )}
      </Show>
    </Dynamic>
  )
}
