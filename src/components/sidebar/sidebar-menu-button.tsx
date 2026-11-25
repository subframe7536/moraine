import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { children as resolveChildren, createMemo, merge, Show, omit } from 'solid-js'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { hasContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler, pick } from '../../shared/utils'
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
    mobile: boolean
  },
): boolean {
  if (!options.mobile || options.disabled || event.defaultPrevented) {
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

/**
 * Interactive navigation button of a `Sidebar.MenuItem`, with optional `leading` and `trailing`
 * icons and an `active` highlight. Renders a `button`, or an `a` when `href` is set; pass `as` to
 * render a custom link component. On mobile, a button with `href` closes the drawer when activated
 * unless `closeOnSelect` is `false`.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Menu>
 *       <Sidebar.MenuItem>
 *         <Sidebar.MenuButton href="/settings" leading="i-lucide:settings" active>
 *           Settings
 *         </Sidebar.MenuButton>
 *       </Sidebar.MenuItem>
 *     </Sidebar.Menu>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export function SidebarMenuButton<T extends ValidComponent = 'button'>(
  props: SidebarT.MenuButtonProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const local = pick(
    props as SidebarT.MenuButtonProps<T> & { ref?: unknown },
    'as',
    'children',
    'class',
    'closeOnSelect',
    'disabled',
    'href',
    'active',
    'leading',
    'ref',
    'style',
    'trailing',
  )
  const rest = omit(
    props as SidebarT.MenuButtonProps<T> & { ref?: unknown },
    'as',
    'children',
    'class',
    'closeOnSelect',
    'disabled',
    'href',
    'active',
    'leading',
    'ref',
    'style',
    'trailing',
  )

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
      active: () => Boolean(local.active),
      disabled,
      mobile: context.mobile,
    }),
  })

  const root = createPolymorphicRoot({
    tag: resolvedTag,
    ref: () => local.ref,
  })

  const interactionRest = merge(rest, {
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
          mobile: context.mobile(),
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

  const elementProps = merge(interactionProps, {
    get href() {
      return resolvedTag() === 'a' && disabled() ? null : local.href
    },
    get title() {
      return (rest as { title?: string }).title
    },
    get 'aria-current'() {
      if ((resolvedTag() === 'a' || local.href !== undefined) && local.active) {
        return (rest as { 'aria-current'?: string })['aria-current'] ?? 'page'
      }
      return (rest as { 'aria-current'?: string })['aria-current']
    },
  })

  const binding = root.bind(elementProps)
  const children = resolveChildren(() => local.children)
  const hasChildren = () => hasContent(children())
  const Root = dynamic(resolvedTag)
  return (
    <Root data-slot="sidebar-menu-button" {...menuButtonSlot} {...binding}>
      <Show when={local.leading}>
        {(iconName) => (
          <Icon
            name={iconName()}
            data-slot="sidebar-menu-button-leading"
            {...menuButtonLeadingSlot}
            aria-hidden={'true'}
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
            aria-hidden={'true'}
          />
        )}
      </Show>
    </Root>
  )
}
