import type { JSX } from 'solid-js'
import { children as resolveChildren, Show, splitProps } from 'solid-js'

import { hasContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
import { Collapsible } from '../collapsible'
import { useCollapsibleContext } from '../collapsible/collapsible-context'
import type { IconT } from '../icon'
import { Icon } from '../icon'

import { useSidebarStyles } from './sidebar-context'
import { SidebarMenuItem } from './sidebar-menu-item'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

const DEFAULT_SUBMENU_TRAILING: IconT.Name = 'i-lucide:chevron-right'

/** Interactive trigger for expanding or collapsing sidebar sub-navigation. */
export function SidebarMenuSubTrigger<T extends ValidComponent = 'button'>(
  props: SidebarT.MenuSubTriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'leading',
    'style',
    'trailing',
  ])

  const resolved = useSidebarStyles('menuSubTrigger', local)
  const disclosure = useCollapsibleContext()?.disclosure

  const trailingIcon = () => local.trailing ?? DEFAULT_SUBMENU_TRAILING
  const children = resolveChildren(() => local.children)
  const hasChildren = () => hasContent(children())

  const onClick = (event: MouseEvent) => {
    callHandler(
      event,
      (rest as { onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent> }).onClick,
    )
  }

  return (
    <Show
      when={hasChildren()}
      fallback={
        <Collapsible.Trigger
          as={(local.as ?? 'button') as ValidComponent}
          data-slot="sidebar-menu-sub-trigger"
          {...rest}
          {...resolved.slots.menuSubTrigger}
          onClick={onClick}
        >
          <Icon
            name={trailingIcon()}
            data-slot="sidebar-menu-item-trailing"
            {...resolved.slots.menuItemTrailing}
            aria-hidden={true}
            {...sidebarDataAttributes.menuItemTrailing({
              expanded: () => Boolean(disclosure?.open()),
            })}
          />
        </Collapsible.Trigger>
      }
    >
      <SidebarMenuItem
        as={Collapsible.Trigger}
        data-slot="sidebar-menu-sub-trigger"
        leading={local.leading}
        trailing={trailingIcon()}
        {...rest}
        class={local.class}
        style={local.style}
        onClick={onClick}
      >
        {children()}
      </SidebarMenuItem>
    </Show>
  )
}
